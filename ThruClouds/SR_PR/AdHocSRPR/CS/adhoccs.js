/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/ui/message', 'N/search', 'N/currentRecord', 'N/format', '../Library/slmapping.js', 'N/url', '../Library/globalcs.js', 'N/runtime'],

    function (message, search, currentRecord, format, slMapping, url, globalcs, runtime) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            try {
                console.log('Page Fully Loaded.');
                var currentRecord = scriptContext.currentRecord;
                let urlParams = new URLSearchParams(window.location.search);
                // Get the value of the 'data' parameter
                let dataParam = urlParams.get('data');
                // Parse the 'data' parameter value as JSON
                let arrjsonData = JSON.parse(dataParam);
                console.log('arrjsonData', arrjsonData);
                if (arrjsonData) {
                    arrjsonData.forEach(data => {
                        console.log('data', data);
                        for (let key in data) {
                            let value = data[key];
                            console.log('key:', key, 'value:', value);
                            // If the field is a date field, convert the string to a Date object
                            if (key.includes('date')) {
                                value = new Date(value);
                            }
                            if (key.includes('location')) {
                                currentRecord.setText({
                                    fieldId: key,
                                    text: value
                                });
                            } else {
                                currentRecord.setValue({
                                    fieldId: key,
                                    value: value
                                });
                            }
                        }
                    });
                }
                let postParam = urlParams.get('postData');
                let arrjsonPostData = JSON.parse(postParam);
                if (arrjsonPostData){
                    let objMessage = message.create({
                        type: message.Type.WARNING,
                        ...globalcs.NOTIFICATION.RUNMR
                    });
                    objMessage.show({
                        duration: 5000 // will disappear after 5s
                    });
                }

            } catch (error) {
                console.log('Error: pageInit', error.message);
            }
        }
        

        function fieldChanged(scriptContext) {
            try {
                var currentRecord = scriptContext.currentRecord;
                console.log('fieldChanged', scriptContext.fieldId)
                if (scriptContext.fieldId == 'custpage_trans_type') {
                    let strTransType = scriptContext.currentRecord.getValue(scriptContext.fieldId)
                    if (strTransType == 'PR'){
                        currentRecord.setValue({
                            fieldId: 'custpage_to_location',
                            value: ''
                        })
                        let toLocationField = currentRecord.getField({
                            fieldId: 'custpage_to_location'
                        });
                        toLocationField.isDisplay = false;
                        toLocationField.isMandatory = false;
                    } else {
                        let toLocationField = currentRecord.getField({
                            fieldId: 'custpage_to_location'
                        });
                        toLocationField.isDisplay = true;
                        toLocationField.isMandatory = true;
                    }
                }
                if (scriptContext.fieldId == 'custpage_to_date') {
                    let strFromDate = currentRecord.getValue({
                        fieldId: 'custpage_from_date'
                    });
                    let strToDate = currentRecord.getValue({
                        fieldId: 'custpage_to_date'
                    });
                    var fromDate = new Date(strFromDate);
                    var toDate = new Date(strToDate);
                
                    if (toDate && fromDate && toDate < fromDate) {
                        alert('User Error: The "DATE TO" must come after the "DATE FROM".');
                        currentRecord.setValue({
                            fieldId: 'custpage_to_date',
                            value: '' // Clear the value
                        });
                    }
                }
            } catch (error) {
                console.log('Error: fieldChanged', error.message)
            }
        }

        function saveRecord(scriptContext) {
            try {
                var rec = scriptContext.currentRecord;
                var intItemLines = rec.getLineCount('custpage_sublist');
                if(intItemLines == 0) {
				    alert('User Error: Please submit at least one item.');
				    return false;
			    } else {
                    return true;
                }
            } catch (error) {
                console.log('Error: saveRecord', error.message)
            }
        }

        function searchItems(scriptContext) {
            let arrParameter = []
            let currRec = currentRecord.get()
            console.log('searchItems currRec', currRec)
            try {
                for (let strKey in slMapping.SUITELET.form.fields) {
                    const fieldValues = {}
                    let fieldId = slMapping.SUITELET.form.fields[strKey].id
                    let value = ''
                    switch (fieldId) {
                        case 'custpage_from_location':
                        case 'custpage_to_location':
                            value = currRec.getText({
                                fieldId: fieldId
                            });
                            break;
                        default:
                            value = currRec.getValue({
                                fieldId: fieldId
                            });
                            break;
                    }
                    
                    fieldValues[fieldId] = value; // Dynamically setting fieldId

                    if (fieldId.includes("date") && value) {
                        // Format the date value
                        let formattedValue = format.format({
                            value: value,
                            type: format.Type.DATE
                        });
                        fieldValues[fieldId] = formattedValue;
                    }

                    arrParameter.push(fieldValues);
                }
                console.log('searchItems arrParameter', JSON.stringify(arrParameter))
                let blnisValid = false
                let counter = 0
                arrParameter.forEach(data => {
                    if (data.custpage_trans_type){
                        counter++
                    }
                    if (data.custpage_from_date){
                        counter++
                    }
                    if (data.custpage_to_date){
                        counter++
                    }
                    if (data.custpage_from_location){
                        counter++
                    }
                    if (data.custpage_to_location){
                        counter++
                    }
                });
                if (arrParameter[0].custpage_trans_type === "PR" && counter === 4) {
                    blnisValid = true;
                } else if (arrParameter[0].custpage_trans_type === "SR" && counter === 5) {
                    blnisValid = true;
                }
                console.log('searchItems counter', counter)
                console.log('searchItems blnisValid', blnisValid)
                if (blnisValid){
                    var sURL = url.resolveScript({
                        scriptId : slMapping.SUITELET.scriptid,
                        deploymentId : slMapping.SUITELET.deploymentid,
                        returnExternalUrl : false,
                        params : {
                            data: JSON.stringify(arrParameter)
                        }
                    });
                
                    window.onbeforeunload = null;
                    window.location = sURL;
                } else {
                    let objMessage = message.create({
                        type: message.Type.WARNING,
                        ...globalcs.NOTIFICATION.REQUIRED
                    });
                    objMessage.show({
                        duration: 5000 // will disappear after 5s
                    });
                }
            } catch (error) {
                console.log('Error: searchItems', error.message)
            }
        }

        function refreshPage(scriptContext) {
            try {          
                var sURL = url.resolveScript({
                    scriptId : slMapping.SUITELET.scriptid,
                    deploymentId : slMapping.SUITELET.deploymentid,
                    returnExternalUrl : false,
                });
            
                window.onbeforeunload = null;
                window.location = sURL;
            } catch (error) {
                console.log('Error: refreshPage', error.message)
            }
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            searchItems: searchItems,
            refreshPage: refreshPage,
        };

    });
