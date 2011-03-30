$(document).ready(function(e) {
    $('#search-box').keyup(function(e) {
        e.preventDefault();
        
        // This is used to prevent a search while the user is typing. Timeout is 200 ms.
        clearTimeout(keyupTimer);
        keyupTimer = setTimeout(search, 200);
    });

    $('#search').submit(function(e){
        
        // Search button doesn't really do anything... searches happen automatically.
        e.preventDefault();
    });

});


function search() {
    suggestWords = [];
    var q = $('#search-box').val();
    if (lastQuery == q) {
        
        // The user hasn't changed the query - don't re-execute.
        return false;
    }
    lastQuery = q;    
    if(q == ''){
        
        // User deleted query - return all results.

        filters['search'] = [];
        resetTable();
        return false;
    } 

    // Filters is a globally defined list of filters - see script.js:144 for where it calls searchFunction() below
    filters['search'] = [{'query':q}];
    
    // Redraw table with newly filtered set of alarms
    resetTable();
    
    // If there were matches, add them to an autocomplte box
    if (suggestWords.length > 0) {
        $('#search-box').autocomplete({source:suggestWords});
    }
}

var lastQuery = null;
var keyupTimer = null;
var suggestWords = [];

function searchFunction(alarm) {
   q = $('#search-box').val();
   found = false;
   $.each(alarm, function(field, value) {
       var alarmValue = value;
       
       // Need to format the date and time to the way they are displayed so they can be searched
       if (field == 'date') {
           alarmValue = formatDate(alarm.time, "MM/dd/yy");
       } else if (field == 'time') {
           alarmValue = formatDate(alarm.time, "h:mma");
       }
       
       // Take each word in the field and each word in the query and compare them
       $.each(alarmValue.split(' '), function(indexA, alarmTerm) {
    	   $.each(q.split(' '), function(indexQ, queryTerm) {
        	   if (alarmTerm.indexOf(queryTerm) == 0) {
                  
                   // Add the word to the suggested word list if its unique and the word list isn't full
                   if (suggestWords.length < 10 && suggestWords.indexOf(alarmValue) < 0) {
                       suggestWords.push(alarmValue);
                   }
                   found = true;
                }
           });
       });
   });
   return found;
}


