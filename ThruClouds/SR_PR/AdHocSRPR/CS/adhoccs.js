/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/ui/message', 'N/search', 'N/currentRecord', 'N/format', '../Library/slmapping.js', 'N/url', '../Library/globalcs.js'],

    function (message, search, currentRecord, format, slMapping, url, globalcs) {

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
            console.log('Page Fully Loaded.');

        }

        function fieldChanged(scriptContext) {
            var currentRecord = scriptContext.currentRecord;
            if (scriptContext.fieldId == 'custpage_trans_type') {
                let strTransType = scriptContext.currentRecord.getValue(scriptContext.fieldId)
                if (strTransType == 'PR'){
                    currentRecord.setValue({
                        fieldId: 'custpage_to_location',
                        value: ''
                    })
                    currentRecord.getField({
                        fieldId: 'custpage_to_location'
                    }).isDisplay = false;
                } else {
                    currentRecord.getField({
                        fieldId: 'custpage_to_location'
                    }).isDisplay = true;
                }
               
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
                    let value = currRec.getValue({
                        fieldId: fieldId
                    });
                    fieldValues[fieldId] = value; // Dynamically setting fieldId

                    if (fieldId.includes("date") && value) {
                        // Format the date value
                        formattedValue = format.format({
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
                });
                if (counter == 4){
                    blnisValid = true
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
            var sURL = url.resolveScript({
                scriptId : slMapping.SUITELET.scriptid,
                deploymentId : slMapping.SUITELET.deploymentid,
                returnExternalUrl : false,
            });
        
            window.onbeforeunload = null;
            window.location = sURL;
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            searchItems: searchItems,
            refreshPage: refreshPage,
        };

    });
