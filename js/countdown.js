(function($) {
    $.fn.countdown = function(options, callback) {
        // Custom 'this' selector
        const thisEl = $(this);

        // Array of custom settings
        const settings = { 
            'date': null,
            'format': null
        };

        // Append the settings array to options
        if (options) {
            $.extend(settings, options);
        }
        
        // Main countdown function
        function countdown_proc() {
            const eventDate = Date.parse(settings['date']) / 1000;
            const currentDate = Math.floor($.now() / 1000);
            
            if (eventDate <= currentDate) {
                callback.call(this);
                clearInterval(interval);
            }
            
            let seconds = eventDate - currentDate;
            
            let days = Math.floor(seconds / (60 * 60 * 24)); // Calculate the number of days
            seconds -= days * 60 * 60 * 24; // Update the seconds variable with no. of days removed
            
            let hours = Math.floor(seconds / (60 * 60));
            seconds -= hours * 60 * 60; // Update the seconds variable with no. of hours removed
            
            let minutes = Math.floor(seconds / 60);
            seconds -= minutes * 60; // Update the seconds variable with no. of minutes removed
            
            // Conditional Ss
            if (days == 1) { thisEl.find(".timeRefDays").text("day"); } else { thisEl.find(".timeRefDays").text("days"); }
            if (hours == 1) { thisEl.find(".timeRefHours").text("hour"); } else { thisEl.find(".timeRefHours").text("hours"); }
            if (minutes == 1) { thisEl.find(".timeRefMinutes").text("minute"); } else { thisEl.find(".timeRefMinutes").text("minutes"); }
            if (seconds == 1) { thisEl.find(".timeRefSeconds").text("second"); } else { thisEl.find(".timeRefSeconds").text("seconds"); }
            
            // Logic for the two_digits ON setting
            if (settings['format'] == "on") {
                days = (String(days).length >= 2) ? days : "0" + days;
                hours = (String(hours).length >= 2) ? hours : "0" + hours;
                minutes = (String(minutes).length >= 2) ? minutes : "0" + minutes;
                seconds = (String(seconds).length >= 2) ? seconds : "0" + seconds;
            }
            
            // Update the countdown's html values
            if (!isNaN(eventDate)) {
                thisEl.find(".days").text(days);
                thisEl.find(".hours").text(hours);
                thisEl.find(".minutes").text(minutes);
                thisEl.find(".seconds").text(seconds);
            } else { 
                alert("Invalid date. Here's an example: 12 Tuesday 2012 17:30:00");
                clearInterval(interval); 
            }
        }
        
        // Run the function
        countdown_proc();
        
        // Loop the function
        const interval = setInterval(countdown_proc, 1000);
    }
})(jQuery);