/**
 * @NModuleScope Public
 * @NApiVersion 2.x
 */
define(
['N/search', 'N/runtime', 'N/format', 'N/error', 'N/util'],
/**
 * @param {search} search
 * @param {runtime} runtime
 * @param {format} format
 * @param {error} error
 */
function(search, runtime, format, error, util)
{
	var NSUtil = {};
	
	NSUtil.addDays = function(dtDate, intDays) 
	{
		var dtResult = new Date(dtDate);
		dtResult.setDate(dtResult.getDate() + intDays);
		return dtResult;
	}

	NSUtil.isEmpty = function(stValue)
	{
		return ((stValue === '' || stValue == null || stValue == undefined) ||
			(stValue.constructor === Array && stValue.length == 0) ||
			(stValue.constructor === Object && (function(v)
			{
				for (var k in v) return false;
				return true;
			})(stValue)));
	};
	
	NSUtil.forceInt = function(stValue)
    {
    	var intValue = parseInt(stValue, 10);

    	if (isNaN(intValue) || (stValue == Infinity))
    	{
    		return 0;
    	}

    	return intValue;
    };

    NSUtil.forceFloat = function(stValue)
    {
    	var flValue = parseFloat(stValue);

    	if (isNaN(flValue) || (stValue == Infinity))
    	{
    		return 0.00;
    	}

    	return flValue;
    };

    NSUtil.getListRecordValue = function(objValue)
    {
        var retVal = '';

        if(NSUtil.isEmpty(objValue))
        {
            retVal = '';
        }
        else if(objValue == true || objValue == false)
        {
            retVal = objValue;
        }
        else
        {
            if(NSUtil.isEmpty(objValue[0].value))
            {
                retVal = objValue;
            }
            else
            {
                retVal = objValue[0].value;   
            }
        }

        return retVal;
    };

    NSUtil.splitAndTrim = function(stValue)
    {
        if(!stValue) return null;

        return stValue.toLowerCase().replace(/\s+/g,'').split(',');
    };

	NSUtil.inArray = function(stValue, arrValue)
	{
		for (var i = arrValue.length - 1; i >= 0; i--)
		{
			if (stValue == arrValue[i])
			{
				break;
			}
		}
		return (i > -1);
	};

	NSUtil.search = function(stRecordType, stSearchId, arrSearchFilter, arrSearchColumn, arrSearchSetting)
	{
		if (stRecordType == null && stSearchId == null)
		{
			error.create(
				{
					name : 'SSS_MISSING_REQD_ARGUMENT',
					message : 'search: Missing a required argument. Either stRecordType or stSearchId should be provided.',
					notifyOff : false
				});
		}

		var arrReturnSearchResults = new Array();
		var objSavedSearch;

		var maxResults = 1000;

		if (stSearchId != null)
		{
			objSavedSearch = search.load(
				{
					id : stSearchId
				});

			// add search filter if one is passed
			if (arrSearchFilter != null)
			{
				if (arrSearchFilter[0] instanceof Array || (typeof arrSearchFilter[0] == 'string'))
				{
					objSavedSearch.filterExpression = objSavedSearch.filterExpression.concat(arrSearchFilter);
				}
				else
				{
					objSavedSearch.filters = objSavedSearch.filters.concat(arrSearchFilter);
				}
			}

			// add search column if one is passed
			if (arrSearchColumn != null)
			{
				objSavedSearch.columns = objSavedSearch.columns.concat(arrSearchColumn);
			}
		}
		else
		{
			objSavedSearch = search.create(
				{
					type : stRecordType
				});

			// add search filter if one is passed
			if (arrSearchFilter != null)
			{
				if (arrSearchFilter[0] instanceof Array || (typeof arrSearchFilter[0] == 'string'))
				{
					objSavedSearch.filterExpression = arrSearchFilter;
				}
				else
				{
					objSavedSearch.filters = arrSearchFilter;
				}
			}

			// add search column if one is passed
			if (arrSearchColumn != null)
			{
				objSavedSearch.columns = arrSearchColumn;
			}
			
			// add search setting if one is passed
			if (arrSearchSetting != null)
			{
				objSavedSearch.settings = arrSearchSetting;
			}
		}

		var objResultset = objSavedSearch.run();
		var intSearchIndex = 0;
		var arrResultSlice = null;
		do
		{
			arrResultSlice = objResultset.getRange(intSearchIndex, intSearchIndex + maxResults);
			if (arrResultSlice == null)
			{
				break;
			}

			arrReturnSearchResults = arrReturnSearchResults.concat(arrResultSlice);
			intSearchIndex = arrReturnSearchResults.length;
		}
		while (arrResultSlice.length >= maxResults);

		return arrReturnSearchResults;
	};
	
	NSUtil.isClosedPostingPeriod = function(stPeriodName)
	{
		var bIsClosed = true;
		
		var objPdSearch = search.create({
			type: 'accountingperiod',
			filters : 
			[
				['periodname', 'is', stPeriodName], 'AND',
				['isyear', 'is', 'F'], 'AND',
				['isquarter', 'is', 'F'], 'AND',
				['closed', 'is', 'F'], 'AND',
				['alllocked', 'is', 'F']
			],
			columns :  ['periodname']
		});
		
		objPdSearch.run().each(function(objResult){
			bIsClosed = false;
			return false;
		});

		return bIsClosed;
	};
	
	NSUtil.roundDecimalAmount = function(flDecimalNumber, intDecimalPlace)
    {
    	//this is to make sure the rounding off is correct even if the decimal is equal to -0.995
    	var bNegate = false;
    	if (flDecimalNumber < 0)
    	{
    		flDecimalNumber = Math.abs(flDecimalNumber);
    		bNegate = true;
    	}

    	var flReturn = 0.00;
    	intDecimalPlace = (intDecimalPlace == null || intDecimalPlace == '') ? 0 : intDecimalPlace;

    	var intMultiplierDivisor = Math.pow(10, intDecimalPlace);
    	flReturn = Math.round((parseFloat(flDecimalNumber) * intMultiplierDivisor)) / intMultiplierDivisor;
    	flReturn = (bNegate) ? (flReturn * -1) : flReturn;

		return flReturn.toFixed(intDecimalPlace);
    };

	return NSUtil;
});