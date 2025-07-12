import firebase_admin
from firebase_admin import credentials, db
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from datetime import datetime
from zoneinfo import ZoneInfo
import logging
import sys

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO,
    handlers=[
        logging.FileHandler('bot_debug.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Set Colombo timezone
COLOMBO_TZ = ZoneInfo('Asia/Colombo')

# Initialize Firebase
cred = credentials.Certificate("YOUR_FIREBASE_SECRET_HERE")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'YOUR_FIREBASE_DATABASE_URL_HERE'
})

def verify_connection():
    """Test Firebase connection"""
    try:
        test_ref = db.reference('connection_test')
        test_data = {'test': True, 'timestamp': int(datetime.now(COLOMBO_TZ).timestamp())}
        test_ref.set(test_data)
        if test_ref.get():
            test_ref.delete()
            return True
        return False
    except Exception as e:
        logger.error(f"Connection test failed: {str(e)}")
        return False

async def execute_feed(user, use_servo=False):
    """Execute a feed command and record history"""
    try:
        timestamp = int(datetime.now(COLOMBO_TZ).timestamp())
        
        # Write command
        db.reference('device/commands/latest').set({
            'feed': True,
            'servo': use_servo,
            'requestedAt': timestamp,
            'requestedBy': f"Telegram: {user.first_name}",
            'userId': str(user.id),
            'status': 'pending'
        })
        
        # Record history
        db.reference('feedingHistory').push().set({
            'timestamp': timestamp,
            'user': user.first_name,
            'userId': str(user.id),
            'type': 'manual',
            'method': 'servo' if use_servo else 'stepper',
            'status': 'requested',
            'source': 'telegram_bot'
        })
        
        return True
    except Exception as e:
        logger.error(f"Feed execution failed: {str(e)}")
        return False

async def toggle_servo(user, enable):
    """Toggle servo mode"""
    try:
        db.reference('device/settings/servoEnabled').set(enable)
        return True
    except Exception as e:
        logger.error(f"Servo toggle failed: {str(e)}")
        return False

async def get_history_entries():
    """Get all history entries with client-side sorting"""
    try:
        history_ref = db.reference('feedingHistory')
        history = history_ref.get()
        
        if not history:
            return []
            
        entries = []
        for key, entry in history.items():
            try:
                if 'timestamp' in entry:
                    entries.append({
                        'key': key,
                        'timestamp': entry['timestamp'],
                        'data': entry
                    })
            except Exception as e:
                logger.warning(f"Skipping invalid entry {key}: {str(e)}")
                
        entries.sort(key=lambda x: x['timestamp'], reverse=True)
        return entries
        
    except Exception as e:
        logger.error(f"History retrieval failed: {str(e)}")
        return None

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send welcome message"""
    keyboard = [
        [InlineKeyboardButton("🍗 Feed Now (Stepper)", callback_data="feed_stepper")],
        [InlineKeyboardButton("🍗 Feed Now (Servo)", callback_data="feed_servo")],
        [InlineKeyboardButton("📜 View History", callback_data="history")],
        [InlineKeyboardButton("⚙️ Check Settings", callback_data="settings")],
        [InlineKeyboardButton("🔄 Toggle Servo Mode", callback_data="toggle_servo")]
    ]
    await update.message.reply_text(
        text="🐟 Fish Feeder Control Panel\nChoose an option:",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def handle_feed_stepper(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle stepper feed command"""
    query = update.callback_query
    await query.answer()
    
    user = update.effective_user
    logger.info(f"Stepper feed request from {user.first_name}")
    
    if await execute_feed(user, use_servo=False):
        await query.edit_message_text("✅ Stepper feeding command sent successfully!")
    else:
        await query.edit_message_text("⚠️ Failed to send stepper feeding command")

async def handle_feed_servo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle servo feed command"""
    query = update.callback_query
    await query.answer()
    
    user = update.effective_user
    logger.info(f"Servo feed request from {user.first_name}")
    
    if await execute_feed(user, use_servo=True):
        await query.edit_message_text("✅ Servo feeding command sent successfully!")
    else:
        await query.edit_message_text("⚠️ Failed to send servo feeding command")

async def handle_toggle_servo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Toggle servo mode"""
    query = update.callback_query
    await query.answer()
    
    try:
        current_mode = db.reference('device/settings/servoEnabled').get()
        new_mode = not current_mode if current_mode is not None else True
        
        if await toggle_servo(update.effective_user, new_mode):
            await query.edit_message_text(f"✅ Servo mode {'enabled' if new_mode else 'disabled'} successfully!")
        else:
            await query.edit_message_text("⚠️ Failed to toggle servo mode")
    except Exception as e:
        await query.edit_message_text("⚠️ Error toggling servo mode")
        logger.error(f"Servo toggle error: {str(e)}")

async def handle_history(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show feeding history with client-side sorting"""
    query = update.callback_query
    await query.answer()
    
    try:
        entries = await get_history_entries()
        if not entries:
            await query.edit_message_text("No feeding history found.")
            return
            
        history_text = "📜 Last 10 Feedings:\n\n"
        for entry in entries[:10]:
            try:
                dt = datetime.fromtimestamp(entry['timestamp'], COLOMBO_TZ)
                history_text += (
                    f"⏰ {dt.strftime('%Y-%m-%d %H:%M:%S')} (IST)\n"
                    f"👤 {entry['data'].get('user', 'Unknown')}\n"
                    f"🔧 {entry['data'].get('type', 'Unknown')}\n"
                    f"🛠️ Method: {entry['data'].get('method', 'Unknown')}\n"
                    f"✅ {entry['data'].get('status', 'Unknown')}\n"
                    f"Source: {entry['data'].get('source', 'unknown')}\n\n"
                )
            except Exception as e:
                history_text += f"⚠️ Error displaying entry: {str(e)}\n\n"
        
        await query.edit_message_text(history_text)
    except Exception as e:
        await query.edit_message_text("⚠️ Error loading history")
        logger.error(f"History error: {str(e)}")

async def handle_settings(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show current settings"""
    query = update.callback_query
    await query.answer()
    
    try:
        settings = db.reference('device/settings').get()
        if not settings:
            await query.edit_message_text("No settings found.")
            return
            
        settings_text = "⚙️ Current Settings:\n\n"
        settings_text += f"Feeding Enabled: {'✅ Yes' if settings.get('feedingEnabled', False) else '❌ No'}\n"
        settings_text += f"Servo Mode: {'✅ Enabled' if settings.get('servoEnabled', False) else '❌ Disabled'}\n"
        
        if 'schedule' in settings:
            settings_text += "\nFeeding Schedule:\n"
            settings_text += f"Time 1: {settings['schedule'].get('time1', 'Not set')} (IST)\n"
            settings_text += f"Time 2: {settings['schedule'].get('time2', 'Not set')} (IST)\n"
            settings_text += f"Time 3: {settings['schedule'].get('time3', 'Not set')} (IST)\n"
        
        temp = db.reference('device/sensors/temperature').get()
        if temp is not None:
            settings_text += f"\n🌡️ Current Temperature: {temp}°C\n"
        
        await query.edit_message_text(settings_text)
    except Exception as e:
        await query.edit_message_text("⚠️ Error loading settings")
        logger.error(f"Settings error: {str(e)}")

def main():
    """Start the bot"""
    if not verify_connection():
        logger.critical("Cannot connect to Firebase")
        sys.exit(1)
    
    try:
        app = Application.builder().token("YOUR_BOT_API_KEY_HERE").build()
        app.add_handler(CommandHandler("start", start))
        app.add_handler(CallbackQueryHandler(handle_feed_stepper, pattern="^feed_stepper$"))
        app.add_handler(CallbackQueryHandler(handle_feed_servo, pattern="^feed_servo$"))
        app.add_handler(CallbackQueryHandler(handle_toggle_servo, pattern="^toggle_servo$"))
        app.add_handler(CallbackQueryHandler(handle_history, pattern="^history$"))
        app.add_handler(CallbackQueryHandler(handle_settings, pattern="^settings$"))
        
        logger.info("Starting bot...")
        app.run_polling()
    except Exception as e:
        logger.critical(f"Bot crashed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
