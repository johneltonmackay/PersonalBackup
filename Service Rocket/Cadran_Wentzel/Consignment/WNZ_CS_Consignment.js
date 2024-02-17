/**
 * Copyright (c) 2018
 * AppWrap LLC
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of AppWrap LLC. ("Confidential Information").
 * You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the license
 * agreement you entered into with AppWrap LLC.
 *
 *     |---------------------------------------------------------------------------------------------------------------------------------------|
 *     | Author                      | Date          | Version       | Comments                                                                |
 *     |-----------------------------|---------------|---------------|-------------------------------------------------------------------------|
 *     | MJ Pascual	                 | Feb 28 2018   | 1.1           | Initial Version                                                         |
 *     |---------------------------------------------------------------------------------------------------------------------------------------|
 *
 */


/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/url', 'N/currentRecord', 'N/format'], function(record, url, currentRecord, format) {
	
	
	/**
	 * Field Changed
	 * @param context
	 * @returns {Boolean}
	 */
	 saveRecord = function (context) {

		try
		{
			var rec = context.currentRecord;
			var intItemLen = rec.getLineCount('custpage_sublist');
			
			if(intItemLen == 0) 
			{
				alert('User Error: Please select at least one item.');
				return false;
			}
			
		}
		catch (e)
		{
			if (e.message != undefined)
			{
				log.error('ERROR' , e.name + ' ' + e.message);
				throw e.name + ' ' + e.message;
			}
			else
			{
				log.error('ERROR', 'Unexpected Error' , e.toString()); 
				throw error.create({
					name: '99999',
					message: e.toString()
				});
			}
		}
		
		return true;

	};
	
	fieldChanged = function (context)
	{
		
		debugger;
		
	    var curRec = context.currentRecord;
        var sublistName = context.sublistId;
        var fldName = context.fieldId;
        var line = context.line;
        
        if(sublistName == 'custpage_sublist' && fldName == 'custpage_select')
        {
        	var bSelect = curRec.getCurrentSublistValue({
	              sublistId: 'custpage_sublist',
	              fieldId: 'custpage_select',
	        });
        	
        	if(bSelect)
        	{
        	    curRec.setCurrentSublistValue({
                    sublistId: 'custpage_sublist',
                    fieldId: 'custpage_reject',
                    value: false,
                    ignoreFieldChange: true,
                    fireSlavingSync: true
                });
        	}
        }
        
        if(sublistName == 'custpage_sublist' && fldName == 'custpage_reject')
        {
        	var bSelect = curRec.getCurrentSublistValue({
	              sublistId: 'custpage_sublist',
	              fieldId: 'custpage_reject',
	        });
        	
        	if(bSelect)
        	{
        	    curRec.setCurrentSublistValue({
                    sublistId: 'custpage_sublist',
                    fieldId: 'custpage_select',
                    value: false,
                    ignoreFieldChange: true,
                    fireSlavingSync: true
                });
        	}
        }
	};

    markAllFunc = function ()
    {	
    	var idx = 1, firstLineEle = null;
    	while(true)
    	{
    		var eleId = 'custpage_select' + idx;
    		var spanEleId = eleId + '_fs'; 
    		idx++;
    		var domEle = document.getElementById(eleId);
    		if(domEle == null || domEle == '' || domEle == undefined)
    			break;
    		if(domEle.checked)
    			continue;
    		
    		domEle = document.getElementById(spanEleId);
    		if(idx == 1)
    			firstLineEle = domEle;
    		
    		if(domEle != null && domEle != '' && domEle != undefined)
    			NLCheckboxOnClick(domEle);
    	}
    	setWindowChanged(window, true);
    };
    
    
    
    unMarkAllFunc = function ()
    {
    	var idx = 1, firstLineEle = null;
    	while(true)
    	{
    		var eleId = 'custpage_select' + idx;
    		var spanEleId = eleId + '_fs'; 
    		idx++;
    		var domEle = document.getElementById(eleId);
    		if(domEle == null || domEle == '' || domEle == undefined)
    			break;
    		if(!domEle.checked)
    			continue;
    		
    		domEle = document.getElementById(spanEleId);
    		if(idx == 1)
    			firstLineEle = domEle;
    		if(domEle != null && domEle != '' && domEle != undefined)
    			NLCheckboxOnClick(domEle);
    	}
    	setWindowChanged(window, true);
    };
	
	doFilter = function ()
    {
		"debugger;" 
		
    	var oCurrentRecord = currentRecord.get();
		var stDeploymentId =  oCurrentRecord.getValue('custpage_depid');
		var stStartDate =  oCurrentRecord.getValue('custpage_startdate');
       // alert(stStartDate);
      	stStartDate = format.format({
			value: stStartDate,
			type: format.Type.DATE
		});
		var stEndDate =  oCurrentRecord.getValue('custpage_enddate');
        //alert(stEndDate);
        stEndDate = format.format({
			value: stEndDate,
			type: format.Type.DATE
		});
		var stProcessType =  oCurrentRecord.getValue('custpage_processtype');
		
		var objParameters = {};
		objParameters.custpage_action = 'FILTER';
		objParameters.custpage_depid = stDeploymentId;
		objParameters.custpage_startdate = stStartDate;
		objParameters.custpage_enddate = stEndDate;
		objParameters.custpage_processtype = stProcessType
					
		var sURL = url.resolveScript(
		{
			scriptId : 'customscript_wnz_sl_consignment',
			deploymentId : stDeploymentId,
			returnExternalUrl : false,
			params : objParameters
    	});

		window.onbeforeunload = null;
		window.location = sURL;
		
 
    };
	
	inArray = function (val, arr)
	{
	
        var bIsInArray = false;

        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == val) {
                bIsInArray = true;
                break;
            }
        }

        return bIsInArray;
    }
	
	convertDate = function(d)
    {
    	 var parts = d.toString().split(" ");
    	 var months = {Jan: "01",Feb: "02",Mar: "03",Apr: "04",May: "05",Jun: "06",Jul: "07",Aug: "08",Sep: "09",Oct: "10",Nov: "11",Dec: "12"};
    	 return parts[2]+"/"+months[parts[1]]+"/"+parts[3];
    }
    
    return {
		saveRecord : saveRecord,
		fieldChanged : fieldChanged,
        markAllFunc : markAllFunc,
        unMarkAllFunc : unMarkAllFunc,
		doFilter : doFilter
    };
    
});


