define(['N/record', 'N/error', 'N/format', 'N/runtime', 'N/search'], function(record, error, format, runtime, search){


	inArray  =  function(stValue, arrValue)
	{
		var bIsValueFound = false;
		for ( var i = arrValue.length - 1; i >= 0; i--)
		{
			if (stValue == arrValue[i])
			{
				bIsValueFound = true;
				break;
			}
		}
		return bIsValueFound;
	}

	isEmpty  = function(stValue)
	{
		if ((stValue == '') || (stValue == null) || (stValue == undefined))
		{
			return true;
		}
		else
		{
			if (stValue instanceof String)
			{
				if ((stValue == ''))
				{
					return true;
				}
			}
			else if (stValue instanceof Array)
			{
				if (stValue.length == 0)
				{
					return true;
				}
			}

			return false;
		}
	}


	convNull = function(value)
	{
		if(value == null || value == undefined)
			value = '';
		return value;
	};


	getObjKey = function (obj)
	{
		var stLogTitle = 'getObjKey';

		var arrObjKey = [];
		for(var key in obj)
		{
			arrObjKey.push(key);
		}

		log.debug(stLogTitle, 'arrObjKey ='+arrObjKey);

		return arrObjKey;
	}

	getAllRowsFromSearch = function(search, recType, searchId, filters, columns, overWriteCols)
	{
		var retList = new Array();
		var srchObj = null;
		if(searchId == null || searchId == '')
			srchObj = search.create({type : recType, filters: filters, columns: columns});
		else
		{
			srchObj = search.load({id : searchId});
			var existFilters = srchObj.filters;
			var existColumns = srchObj.columns;

			existFilters = (existFilters == null || existFilters == '') ? new Array() : existFilters;
			existColumns = (existColumns == null || existColumns == '') ? new Array() : existColumns;
			if(filters != null && filters != '')
			{
				for(var idx=0; idx < filters.length; idx++)
					existFilters.push(filters[idx]);
			}
			if(columns != null && columns != '')
			{
				if(overWriteCols == true)
					existColumns = columns;
				else
				{
					for(var idx=0; idx < columns.length; idx++)
						existColumns.push(columns[idx]);
				}
			}

			srchObj.filters = existFilters;
			srchObj.columns = existColumns;
		}

		var resultSet = srchObj.run();
		var startPos = 0, endPos = 1000;
		while (startPos <= 10000)
		{
			var options = new Object();
			options.start = startPos;
			options.end = endPos;
			var currList = resultSet.getRange(options);
			if (currList == null || currList.length <= 0)
				break;
			if (retList == null)
				retList = currList;
			else
				retList = retList.concat(currList);

			if (currList.length < 1000)
				break;

			startPos += 1000;
			endPos += 1000;
		}

		return retList;
	}

	runSearch = function (search, recType, searchId, filters, columns)
	{
		var srchObj = null;
		if(searchId == null || searchId == '')
			srchObj = search.create({type : recType, filters: filters, columns: columns});
		else
		{
			srchObj = search.load({id : searchId});
			var existFilters = srchObj.filters;
			var existColumns = srchObj.columns;

			existFilters = (existFilters == null || existFilters == '') ? new Array() : existFilters;
			existColumns = (existColumns == null || existColumns == '') ? new Array() : existColumns;
			if(filters != null && filters != '')
			{
				for(var idx=0; idx < filters.length; idx++)
					existFilters.push(filters[idx]);
			}
			if(columns != null && columns != '')
			{
				for(var idx=0; idx < columns.length; idx++)
					existColumns.push(columns[idx]);
			}

			srchObj.filters = existFilters;
			srchObj.columns = existColumns;
		}

		var resultSet = srchObj.run();

		return resultSet;
	}


	forceFloat =  function(stValue)
	{
		var flValue = parseFloat(stValue);

		if (isNaN(flValue))
		{
			return 0.00;
		}

		return flValue;
	}

	formatDate = function (initialFormattedDateString)
	{
		return format.parse({value: initialFormattedDateString,type: format.Type.DATE });
	}

	formatDateDDMMMYYYY = function(date)
	{
		var stDate = '';
		if(date)
		{
			var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			var d = formatDate(date);
			var year = d.getFullYear();
			var month = '' + (d.getMonth());
			var day = '' + d.getDate();
			stDate = day+'-'+months[month]+'-'+year;
		}
		return  stDate;
	}


	return {

	};

});
