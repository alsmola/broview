var alarms = alarms.map(function(alarm) {
    newAlarm = alarm;
    newAlarm.time = new Date(alarm.time.substring(0, alarm.time.length - 3));
    return newAlarm;
});

filters = 
	{	'action': [], 
		'date' : [],
		'time' : [],
		'alarm' : [],
		'message' : [],
		'srcIp' : [],
		'srcPrt' : [],
		'dstIp' : [],
		'dstPrt' : []  
	};


function filterAlarms(alarms) {
    filteredAlarms = alarms;
	$.each(filters, function(key, category) {
		$.each(category, function(index, filter) {
		    var filterFunction;
		    if (key == 'action') {
			    filterFunction = function(alarm) {
			        alarmLevel = getActionLevel(alarm.action);
                    if (filter.predicate == 'at least') {
                        return  alarmLevel >= filter.actionLevel;
                    } else if (filter.predicate == 'equal') {
                        return alarmLevel == filter.actionLevel;
                    } else {
                        return alarmLevel <= filter.actionLevel;
                    }
			    };
    		} else if (key == 'date') {
				filterFunction = function(alarm) {
					date = Date.parse(filter.date);
					dateToFilterString = (alarm.time.getMonth() + 1) + '/' + new Date(alarm.time).getDate() + '/' + alarm.time.getFullYear();
					dateToFilter = Date.parse(dateToFilterString);
					if (filter.predicate == 'before') {
						return dateToFilter < date; 
					} else if (filter.predicate == 'after') {
						return dateToFilter > date;
					} else return dateToFilter == date;
				};			
			} else if (key == 'time') {
			    filterFunction = function(alarm) {
			        var newHour =  parseInt(filter.hour) + ((filter.ampm == 'PM') ? 12 : 0);
			        if (filter.predicate == 'before') {
                        return (newHour > alarm.time.getHours() ||
                            filter.minute > alarm.time.getMinutes() && newHour == alarm.time.getHours() ||
                            filter.second > alarm.time.getSeconds() && filter.minute == alarm.time.getMinutes() && newHour == alarm.time.getHours());    
			        } else if (filter.predicate == 'after') {
			            return (newHour < alarm.time.getHours() ||
                            filter.minute < alarm.time.getMinutes() && newHour == alarm.time.getHours() ||
                            filter.second < alarm.time.getSeconds() && filter.minute == alarm.time.getMinutes() && newHour  == alarm.time.getHours());
			        } else {
			            return (newHour == alarm.time.getHours() &&
			                    filter.minute == alarm.time.getMinutes() &&
			                    filter.second == alarm.time.getSeconds());
			        }
			    }
			} else if (key == 'alarm') {
			    filterFunction = function(alarm) {
			        result = true;
			        $.each(filter.regexs, function(index, regex) {
			            if (alarm.alarm.match(regex)) {
			                if (filter.predicate == 'not matching') {
			                    result = false;
			                }
			            } else { 
			                if (filter.predicate == 'matching') {
                                result = false;
			                }
			            }			            
		            });
		            return result;
			    };
    		} else if (key == 'message') {
			    filterFunction = function(alarm) {
			        result = true;
			        $.each(filter.regexs, function(index, regex) {
			            if (alarm.message.match(regex)) {
			                if (filter.predicate == 'not matching') {
			                    result = false;
			                }
			            } else { 
			                if (filter.predicate == 'matching') {
                                result = false;
			                }
			            }			            
		            });
		            return result;
			    };
    		} else if (key == 'srcIp') {
    			filterFunction = function(alarm) {
			        if (filter.predicate == 'matching') {
			            return (ipGreaterThanOrEqual(alarm['srcIp'], filter.startIp) && ipLessThanOrEqual(alarm['srcIp'], filter.endIp));
			        } else {
			            return (ipLessThanOrEqual(alarm['srcIp'], filter.startIp) || ipGreaterThanOrEqual(alarm['srcIp'], filter.endIp));
			        }
			    };
    		} else if (key == 'dstIp') {
    			filterFunction = function(alarm) {
			        if (filter.predicate == 'matching') {
			            return (ipGreaterThanOrEqual(alarm['dstIp'], filter.startIp) && ipLessThanOrEqual(alarm['dstIp'], filter.endIp));
			        } else {
			            return (ipLessThanOrEqual(alarm['dstIp'], filter.startIp) || ipGreaterThanOrEqual(alarm['dstIp'], filter.endIp));
			        }
    			};
    		} else if (key == 'srcPrt') {
    			filterFunction = function(alarm) {
			        $.each(filter.regexs, function(index, regex) {
			            result = true;
			            if (alarm.srcPrt.match(regex)) {
			                if (filter.predicate == 'not matching') {
			                    result = false;
			                }
			            } else { 
			                if (filter.predicate == 'matching') {
                                result = false;
			                }
			            }			            
		            });
		            return result;
			    };
    		} else if (key == 'dstPrt') {
    			filterFunction = function(alarm) {
    			    result = true;
			        $.each(filter.regexs, function(index, regex) {
			            if (alarm.dstPrt.match(regex)) {
			                if (filter.predicate == 'not matching') {
			                    result = false;
			                }
			            } else { 
			                if (filter.predicate == 'matching') {
                                result = false;
			                }
			            }			            
		            });
		            return result;
    			};
    		} else if (key == 'search') {
    		    filterFunction = searchFunction;
    		}
			filteredAlarms = filteredAlarms.filter(filterFunction);
		});
	});
	return filteredAlarms;
}

function getActionLevel(action) {
    var actions = {
        'PAGE': 5,
        'EMAIL': 4,
        'ALARM_PER_CONN': 3,
        'ALARM_ALWAYS': 2,
        'FILE': 1,
        'IGNORE': 0
    };
    return actions[action];
}

function getAction(level) {
    var actions = {
        5: 'PAGE',
        4: 'EMAIL',
        3: 'ALARM_PER_CONN',
        2: 'ALARM_ALWAYS',
        1: 'FILE',
        0: 'IGNORE'
    };
    return actions[level];
}

function ipGreaterThanOrEqual(ip1, ip2) {
    ip1split = ip1.split('.').map(function (x) { return parseInt(x)});
    ip2split = ip2.split('.').map(function (x) { return parseInt(x)});
    return  ip1 == ip2 ||
            ip1split[0] > ip2split[0] ||
           (ip1split[1] > ip2split[1] && ip1split[0] == ip2split[0]) ||
           (ip1split[2] > ip2split[2] && ip1split[1] == ip2split[1] && ip1split[0] == ip2split[0]) ||
           (ip1split[3] > ip2split[3] && ip1split[2] == ip2split[2] && ip1split[1] == ip2split[1] && ip1split[0] == ip2split[0]);
}

function ipLessThanOrEqual(ip1, ip2) {
    return (ip1 == ip2) || (!ipGreaterThanOrEqual(ip1, ip2));
}

function placeFilters() {
	$('#filters').html('');
	$.each(filters, function(index, value) {
		if (index == 'search') return true;
		var filterHtml = '';
		filterHtml = '<td class="filter-section" id="' + index + '-filter-header">'
		filterHtml += '<h3>(' + value.length + ')</h3>'
		filterHtml += filtersHtml(index) + '</td>';
		$('#filters').append(filterHtml)
	});
	$( '.filter-content').hide();
	options = null;
	$( '.filter-section h3').click(function() {
		if (lastMenu != null) {
			lastMenu.hide();
		}

		if (lastFilter != null && $(this).parent().attr('id') != lastFilter.parent().attr('id')) {
			lastFilter.hide();
		}

		var filterContent = $(this).siblings('.filter-content');
		lastFilter = filterContent;
		
		if (filterContent.width() < filterContent.parent().width()) {
			filterContent.width(filterContent.parent().width());
		}
		
		filterContent.toggle('blind', options, 1);
		showFilterMenu(filterContent);
		$(document).one('click', function() {
			filterContent.hide();
		});
		return false;
	});
	
	$('.add-filter').click(function() {
	   var type = $(this).attr('id').replace('add-filter-', '');
       createFilter(type, null);
	});	
}

function filtersHtml(index) {
	content = '<div class="filter-content">';
	$.each(filters[index], function(filterIndex, value) {
		if (index == 'action') {
		    content += filterHtml(value.predicate + ' ' + getAction(value.actionLevel), filterIndex);
		} else if (index == 'date') {
		    content += filterHtml(value.predicate + ' ' + value.date, filterIndex);
		} else if (index == 'time') {
		    content += filterHtml(value.predicate + ' ' + value.hour + ":" + value.minute + ":" + value.second + value.ampm, filterIndex);
		} else if (index == 'alarm') {
    	    content += filterHtml(value.predicate + ' ' + shorten(value.regexs.join(','), 18), filterIndex);
    	} else if (index == 'message') {
            content += filterHtml(value.predicate + ' ' + shorten(value.regexs.join(','), 18), filterIndex);
        } else if (index == 'srcIp' || index == 'dstIp') {
        	content += filterHtml(value.predicate + ' ' + shorten(value.startIp), filterIndex);
        } else if (index == 'srcPrt' || index == 'dstPrt') {
        	content += filterHtml(value.predicate + ' ' + shorten(value.regexs.join(','), 18), filterIndex);
        }
	});
	content += '<button class="add-filter" id="add-filter-' + index + '"></button>';
	content += '</div>';
	return content;
}

function filterHtml(name, filterIndex) {
	var content = '<div class="filter filter-number-' + filterIndex + '">';
	content += createButton(shorten(name), ['Edit', 'Delete', 'Disable']);
	content += '</div>';
	return content
}

function createButton(text, list) {
	if (text == null) {
		text = '&nbsp';
	}
	content = '<button class="menu-button">' + text + '</button><ul>';
	$.each(list, function(index, value) {
		content += '<li><a href="#">' + value + '</a></li>';
	})
	content += '</ul>';
	return content;
}

function shorten(text, length) {
	if (text.length > length) {
		return text.substring(0,length -2) + '...';
	}
	return text;
}

function checked(enabled) {
	if (enabled) {
		return 'checked';
	}
	return '';	   
}

function showFilterMenu(filter) {
	filter.find('.menu-button').button({
		icons: {
			primary: '',
			secondary: 'ui-icon-triangle-1-s'
		}
	}).each(function() {
		$(this).next().menu({
			select: function(event, ui) {
			    var action = ui.item.text();
			    var filterIndex = $(this).parents('.filter').attr('class').replace('filter ', '').replace('filter-number-', '');
				var filterType = $(this).parents('.filter-section').attr('id').replace('-filter-header', '');
                if (action == 'Edit') {
                    editFilter(filterType, filterIndex);
                } else if (action == 'Delete') {
                    deleteFilter(filterType, filterIndex);
                } else if (action == 'Disable' || action == 'Enable') {
                    toggleFilter(filterType, filterIndex);
                } else
				$(this).hide();
			},
			input: $(this)
		}).hide();
	}).click(function(event) {
		var menu = $(this).next();
		
		if (menu.is(':visible')) {
			menu.hide();
			return false;
		}
		
		if (lastMenu != null && lastMenu != menu) {
			lastMenu.hide();
		}
		lastMenu = menu;
		
		menu.menu('deactivate').show().css({top:0, left:0}).position({
			my: 'left top',
			at: 'right top',
			of: this
		});
		
		$(document).one('click', function() {
			menu.hide();
		});
		return false; 
	});
	$('.add-filter').button({icons: {primary: 'ui-icon-plus'}}); 
}


function showAlarmMenu(alarm) {
    alarm.find('.menu-button').button({
		icons: {
			primary: '',
			secondary: 'ui-icon-triangle-1-s'
		}
	}).each(function() {
		$(this).next().menu({
			select: function(event, ui) {
			    var action = ui.item.text();
                if (action == 'Create Filter...') {
                    var type = $(this).parent().attr('class').replace('-create-filter-button', '');
                    var value = $(this).parent().prev().text();
                    createFilter(type, value);
                    return false;
                }
				$(this).hide();
			},
			input: $(this)
		}).hide();
	}).click(function(event) {
		var menu = $(this).next();
		if (menu.is(':visible')) {
			menu.hide();
			return false;
		}
		if (lastMenu != null && lastMenu != menu) {
			lastMenu.hide();
		}
		lastMenu = menu;
		menu.menu('deactivate').show().css({top:0, left:0}).position({
			my: 'left top',
			at: 'right top',
			of: this
		});
		$(document).one('click', function() {
			menu.hide();
		});
		return false; 
	});
}

function createFilter(type, defaultValue) {
    var dialogType = type;
    if (type == 'srcIp' || type == 'dstIp') {
        $('#src-or-dst').val(type.replace('Ip', ''));
        dialogType = 'ip';
    }

    if (type == 'srcPrt' || type == 'dstPrt') {
        $('#prt-src-or-dst').val(type.replace('Prt', ''));
        dialogType = 'prt';
    }

    $('#' + dialogType + '-index').val('-1');
    $('#' + dialogType + '-dialog').dialog( 'open' );

    if (type == 'action') {
        $('#action-predicate option')[1].selected = true;
        $('#action-level option')[getActionLevel(defaultValue)].selected = true;
    } else if (type == 'date') {
        $('#date-predicate option')[1].selected = true;
        $('#datepicker').val(defaultValue);    
    } else if (type == 'time') {
        $('#time-predicate option')[1].selected = true;
        var time = defaultValue.split(':');
        $('#hour').val(time[0]);
        $('#minute').val(time[1].substring(0, 2));
        if (time[1].substring(2, 4) == 'AM') {
            $('#ampm option')[0].selected = true;
        } else {
            $('#ampm option')[1].selected = true;
        }
    } else if (type == 'alarm') {
        $('#alarm-predicate option')[0].selected = true;
    	$('#alarm-regex').val(defaultValue);
    } else if (type == 'message') {
        $('#message-predicate option')[0].selected = true;
    	$('#message-regex').val(defaultValue);
    } else if (type == 'srcIp' || type == 'dstIp') {
        $('#ip-predicate option')[0].selected = true;
        if (defaultValue) {
            ip = defaultValue.split('.');
            $('#ip-start1').val(ip[0]);
            $('#ip-start2').val(ip[1]);
            $('#ip-start3').val(ip[2]);
            $('#ip-start4').val(ip[3]);
            $('#ip-end1').val(ip[0]);
            $('#ip-end2').val(ip[1]);
            $('#ip-end3').val(ip[2]);
            $('#ip-end4').val(ip[3]);
        }
    } else if (type == 'srcPrt' || type == 'dstPrt') {
        $('#prt-predicate option')[0].selected = true;
        $('#prt-regex').val(defaultValue);
    }
}

function editFilter(filterType, filterIndex) {
    filterToEdit = filters[filterType][filterIndex];
    var dialogType = filterType;
    
    if (filterType == 'srcIp' || filterType == 'dstIp') {
	    $('#src-or-dst').val(filerType.replace('Ip', ''));
	    dialogType = 'ip';
    }
    
    if (type == 'srcPrt' || type == 'dstPrt') {
        $('#prt-src-or-dst').val(type.replace('Prt', ''));
        dialogType = 'prt';
    }
    
	$('#' + dialogType + '-dialog').dialog( 'open' );
	$('#' + dialogType + '-index').val(filterIndex);
	if (filterType == 'action') {
	    if (filterToEdit.predicate == 'at least') {
		    $('#action-predicate option')[0].selected = true;
		} else if (filterToEdit.predicate == 'is') {
		    $('#action-predicate option')[1].selected = true;
	    } else {
	        $('#action-predicate option')[2].selected = true;
	    }
        $('#action-level option')[filterToEdit.actionLevel].selected = true;
	} else if (filterType == 'date') {
	    if (filterToEdit.predicate == 'before') {
		    $('#date-predicate option')[0].selected = true;
		} else if (filterToEdit.predicate == 'on') {
		    $('#date-predicate option')[1].selected = true;
	    } else {
	        $('#date-predicate option')[2].selected = true;
	    }
	    $('#datepicker').val(filterToEdit.date);    
	} else if (filterType == 'time') {
	    if (filterToEdit.predicate == 'before') {
		    $('#time-predicate option')[0].selected = true;
		} else if (filterToEdit.predicate == 'on') {
		    $('#time-predicate option')[1].selected = true;
	    } else {
	        $('#time-predicate option')[2].selected = true;
	    }
	    $('#hour').val(filterToEdit.hour);
	    $('#minute').val(filterToEdit.minute);
	    $('#second').val(filterToEdit.second);
	    if (filterToEdit.ampm == 'AM') {
	        $('#ampm option')[0].selected = true;
        } else {
            $('#ampm option')[1].selected = true;
        }
    } else if (filterType == 'alarm') {
	    if (filterToEdit.predicate == 'matching') {
		    $('#alarm-predicate option')[0].selected = true;
		} else {
	        $('#alarm-predicate option')[1].selected = true;
	    }
	    $('#alarm-regex').val(filterToEdit.regexs.join('\n'));
	} else if (filterType == 'message') {
	    if (filterToEdit.predicate == 'matching') {
		    $('#message-predicate option')[0].selected = true;
		} else {
	        $('#message-predicate option')[1].selected = true;
	    }
	    $('#message-regex').val(filterToEdit.regexs.join('\n'));
	} else if (filterType == 'srcIp' || filterType == 'dstIp') {
	    if (filterToEdit.predicate == 'matching') {
		    $('#ip-predicate option')[0].selected = true;
		} else {
	        $('#ip-predicate option')[1].selected = true;
	    }
	    startIp = filterToEdit.startIp.split('.');
		endIp = filterToEdit.endIp.split('.');
	    $('#ip-start1').val(startIp[0]);
	    $('#ip-start2').val(startIp[1]);
	    $('#ip-start3').val(startIp[2]);
	    $('#ip-start4').val(startIp[3]);
	    $('#ip-end1').val(endIp[0]);
	    $('#ip-end2').val(endIp[1]);
	    $('#ip-end3').val(endIp[2]);
	    $('#ip-end4').val(endIp[3]);    			        			    
    } else if (filterType == 'srcPrt' || filterType == 'dstPrt') {
	    if (filterToEdit.predicate == 'matching') {
		    $('#prt-predicate option')[0].selected = true;
		} else {
	        $('#prt-predicate option')[1].selected = true;
	    }
	    $('#prt-regex').val(filterToEdit.regexs.join('\n'));
	}
}

function deleteFilter(filterType, filterIndex) {
    var response = confirm('Are you sure you want to delete this filter?');
    if (response) {
        filters[filterType] = filters[filterType].slice(0, filterIndex).concat(filters[filterType].slice(filterIndex + 1));
        resetTable();
        return true;
    } else {
        return false;
    }
}

function toggleFilter(filterType, filterIndex) {
    return filters[filterType][filterIndex].enabed = !filters[filterType][filterIndex].enabled;
}

function createAlarms() {
	$('.alarm-instance').remove();
	filteredAlarms = filterAlarms(alarms);
	alarmCount = filteredAlarms.length;
	var count = 0;
	$.each(filteredAlarms, function (index, value) {
	    if (++count >= startIndex + 50) {
	        return false;
	    } else if (count < startIndex) {
	        return true;
	    }
		row = '<tr class="alarm-instance">';
		row += '<td colspan="9" class="expando" style="display:none">' + makeAlarmDetail(value) + '</td>';
		row += createAlarmCell(value.action, 'action');
		row += createAlarmCell(formatDate(value.time, "MM/dd/yyyy"), 'date');
		row += createAlarmCell(formatDate(value.time, "hh:mma"), 'time');
		row += createAlarmCell(value.alarm, 'alarm');
		row += createAlarmCell(value.message, 'message');
		row += createAlarmCell(value.srcIp, 'srcIp');;
		row += createAlarmCell(value.srcPrt, 'srcPort');
		row += createAlarmCell(value.dstIp, 'dstIp');
		row += createAlarmCell(value.dstPrt, 'dstPort');
		row += '</tr>';		   
		$('#alarms').append(row); 
	});
}

function makeAlarmDetail(alarm) {
    content = '<table>';
    content += '<tr><td class="label"> Action </td><td>' + alarm.action + '</td><td class="action-create-filter-button">' + createButton(null, ['Create Filter...']) + '</td></tr>';
    content += '<tr><td class="label"> Date </td><td>' + formatDate(alarm.time, "MM/dd/yy") + '</td><td class="date-create-filter-button">' + createButton(null, ['Create Filter...']) + '</td></tr>';
    content += '<tr><td class="label"> Time </td><td>' + formatDate(alarm.time, "h:mma") + '</td><td class="time-create-filter-button">' + createButton(null, ['Create Filter...']) + '</td></tr>';
    content += '<tr><td class="label"> Alarm Type </td><td>' + alarm.alarm + '</td><td class="alarm-create-filter-button">' + createButton(null, ['Create Filter...']) + '</td></tr>';
    content += '</table>';
    content += '<table>';
    content += '<tr><td class="label"> Source IP </td><td>' + alarm.srcIp + '</td><td class="srcIp-create-filter-button">' + createButton(null, ['Create Filter...']) + '</td></tr>';
    content += '<tr><td class="label"> Source Port</td><td>' + alarm.srcPrt + '</td><td class="srcPrt-create-filter-button">' + createButton(null, ['Create Filter...']) + '</td></tr>';
    content += '<tr><td class="label"> Destination IP </td><td>' + alarm.dstIp + '</td><td class="dstIp-create-filter-button">' + createButton(null, ['Create Filter...']) + '</td></tr>';
    content += '<tr><td class="label"> Destination Port </td><td>' + alarm.dstPrt + '</td><td class="dstPrt-create-filter-button">' + createButton(null, ['Create Filter...']) + '</td></tr>';
    content += '</table>';
    return content;
    
}

function createAlarmCell(text, type) {
	return '<td class="' + type + '"><span class="' + type + '-text">' + text + '</span></td>';
}

function buttonizeControls() {
	$('#search-button').button().click(function() {
	    search();
	});
	$('#save').button({icons: {primary: 'ui-icon-disk'}}).click(function() {
	   $('#save-dialog').dialog( 'open' );
	});
	$('#load').button({icons: {primary: 'ui-icon-folder-open'}});
	$('#reset').button({icons: {primary: 'ui-icon-arrowrefresh-1-w'}}).click(function() {
	   $.each(filters, function(index, filterSet) {
	       if (index != 'search') {
	           filters[index] = [];
           }
	   });
	   resetTable();
	});
}

function updatePageControls() {
    $('#start-index').text(startIndex);
    $('#end-index').text(Math.min(alarmCount, startIndex + 50));
    $('#count').text(alarmCount);
    $('#first').show();
    $('#previous').show();
    $('#last').show();
    $('#next').show();
    if (startIndex == 1) {
        $('#first').hide();
        $('#previous').hide();
    } else if (startIndex + 50 >= alarmCount) {
        $('#last').hide();
        $('#next').hide();
    }
}

function makePageControls(alarms) {
    updatePageControls();
    $('#first').click(function() {
        startIndex = 1;
        createAlarms();
        updatePageControls();
        return false;
    });
    
    $('#previous').click(function() {
        startIndex -= 50;
        createAlarms();
        updatePageControls();
        return false;
    });

    $('#last').click(function() {
        count = parseInt($('#count').text());
        startIndex = count - (count % 50) + 1;
        createAlarms();
        updatePageControls();
        return false;
    });
    
    $('#next').click(function() {
        startIndex += 50;
        createAlarms();
        updatePageControls();
        return false;
    });
}

function makeDialogs() {
	$('#action-dialog')
		.dialog({
		autoOpen: false,
		modal: true,
		buttons: {
			Cancel: function() {
				$( this ).dialog('close');
			},
			Save: function() {
	            var filter = {
	                predicate: $('#action-predicate').val(), 
	                actionLevel: $('#action-level').val(), 
	                enabled: true
	            };
				var index = $('#action-index').val();
				if (index == -1) {
					filters['action'].push(filter);
				} else {
					filters['action'][index] = filter;
				}
                resetTable();
				$( this ).dialog('close');		
			}
		}
	}).hide();

	$('#date-dialog')
		.dialog({
		autoOpen: false,
		modal: true,
		buttons: {
			Cancel: function() {
				$( this ).dialog('close');
			},
			Save: function() {
	            var filter = {
	                predicate: $('#date-predicate').val(), 
	                date: $('#datepicker').val(), 
	                enabled: true
	            };
				var index = $('#date-index').val();
				if (index == -1) {
					filters['date'].push(filter);
				} else {
					filters['date'][index] = filter;
				}
                resetTable();
				$( this ).dialog('close');		
			}
		}
	}).hide();
	$('#today').button().hide();
	$('#datepicker').datepicker();
	
	$('#time-dialog')
		.dialog({
		autoOpen: false,
		modal: true,
		buttons: {
			Cancel: function() {
				$( this ).dialog('close');
			},
			Save: function() {
			    var filter = {
			        predicate: $('#time-predicate').val(), 
			        hour: $('#hour').val(), 
			        minute: $('#minute').val(), 
			        second: $('#second').val(), 
			        ampm: $('#ampm').val(), 
			        enabled: true
			    };
				var index = $('#time-index').val();
				if (index == -1) {
					filters['time'].push(filter);
				} else {
					filters['time'][index] = filter;
				}
                resetTable();
				$( this ).dialog('close');
			
			}
		}
	}).hide();
	$('#now').button().hide();
	
	$('#alarm-dialog')
		.dialog({
		autoOpen: false,
		modal: true,
		buttons: {
			Cancel: function() {
				$( this ).dialog('close');
			},
			Save: function() {
			    var filter = {
			        predicate: $('#alarm-predicate').val(), 
			        regexs: $('#alarm-regex').val().split('\n'),  
			        enabled: true
			    };
				var index = $('#alarm-index').val();
				if (index == -1) {
					filters['alarm'].push(filter);
				} else {
					filters['alarm'][index] = filter;
				}
                resetTable();
				$( this ).dialog('close');			
			}
		}
	}).hide();
	
	$('#message-dialog')
		.dialog({
		autoOpen: false,
		modal: true,
		buttons: {
			Cancel: function() {
				$( this ).dialog('close');
			},
			Save: function() {
			    var filter = {
			        predicate: $('#message-predicate').val(), 
			        regexs: $('#message-regex').val().split('\n'),  
			        enabled: true
			    };
				var index = $('#message-index').val();
				if (index == -1) {
					filters['message'].push(filter);
				} else {
					filters['message'][index] = filter;
				}
                resetTable();
				$( this ).dialog('close');			
			}
		}
	}).hide();
	
	$('#ip-dialog')
		.dialog({
		autoOpen: false,
		modal: true,
		buttons: {
			Cancel: function() {
				$( this ).dialog('close');
			}, Save: function() {
			    var srcOrDst = $('#src-or-dst').val();
			    var filter = {
			        predicate: $('#ip-predicate').val(), 
			        startIp: $('#ip-start1').val() + '.' + $('#ip-start2').val() + '.' + $('#ip-start3').val() + '.' + $('#ip-start4').val(),  
			        endIp: $('#ip-end1').val() + '.' + $('#ip-end2').val() + '.' + $('#ip-end3').val() + '.' + $('#ip-end4').val(),
			        enabled: true
			    };
				var index = $('#ip-index').val();
				if (index == -1) {
					filters[srcOrDst + 'Ip'].push(filter);
				} else {
					filters[srcOrDst + 'Ip'][index] = filter;
				}
                resetTable();
				$( this ).dialog('close');			
			}
		}
	}).hide();

	$('#prt-dialog')
		.dialog({
		autoOpen: false,
		modal: true,
		buttons: {
			Cancel: function() {
				$( this ).dialog('close');
			}, Save: function() {
			    var srcOrDst = $('#prt-src-or-dst').val();
			    var filter = {
			        predicate: $('#prt-predicate').val(), 
			        regexs: $('#prt-regex').val().split('\n'),
			        enabled: true
			    };
				var index = $('#prt-index').val();
				if (index == -1) {
					filters[srcOrDst + 'Prt'].push(filter);
				} else {
					filters[srcOrDst + 'Prt'][index] = filter;
				}
                resetTable();
				$( this ).dialog('close');			
			}
		}
	}).hide();

	$('#save-dialog')
		.dialog({
		autoOpen: false,
		modal: true,
		buttons: {
			Cancel: function() {
				$( this ).dialog('close');
			}, Save: function() {
				$( this ).dialog('close');			
			}
		}
	}).hide();

}

function makeAlarmBodies() {
    $('.alarm-instance').live('click', function() {
          $(this).find('td').not('.expando').toggle();
          $(this).find('.expando').toggle(); 
          showAlarmMenu($(this).find('.expando'));
    })
}

function resetTable() {
    startIndex = 1;
    placeFilters();
	createAlarms();
    updatePageControls();
}

var lastMenu = null;
var lastFilter = null;
var startIndex = 1;
var alarmCount  = 0;

$(document).ready(function(e) {
    resetTable();
    makePageControls();
	buttonizeControls();
	makeDialogs();
	makeAlarmBodies();
});