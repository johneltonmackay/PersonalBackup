/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/ui/message'],

    function (currentRecord, message) {

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

            } catch (error) {
                console.log('Error: pageInit', error.message);
            }
        }

        function validateLine(scriptContext) {
            try {
                var currentRecord = scriptContext.currentRecord;
                var sublistName = scriptContext.sublistId;
                if (sublistName === 'item') {
                    let intSpreadInteger = currentRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_sdc_spreadinterger',
                    });
                    console.log("intSpreadInteger", intSpreadInteger)

                    let intDepartment = currentRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'department',
                    });
                    console.log("intDepartment", intDepartment)

                    if (intDepartment == "20"){
                        if (!intSpreadInteger){
                            alert('Please set a Spread Integer value greater than 0 when item is Department 410.')
                            return false
                        }
                    }
                }
                return true;
            } catch (error) {
                console.log('Error: fieldChanged', error.message)
            }
        }
        

        function saveRecord(scriptContext) {
            try {
                var currentRecord = scriptContext.currentRecord;
                let counter = 0
                if (currentRecord) {
                    let numLines = currentRecord.getLineCount({
                        sublistId: 'item'
                    });
                    for (var x = 0; x < numLines; x++) {
                        currentRecord.selectLine({
                            sublistId: 'item',
                            line: x
                        });
                        let intSpreadInteger = currentRecord.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_sdc_spreadinterger',
                        });
                        console.log("intSpreadInteger", intSpreadInteger)
    
                        let intDepartment = currentRecord.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'department',
                        });
                        console.log("intDepartment", intDepartment)

                        if (intDepartment == "20"){
                            if (!intSpreadInteger){
                                let strErrorMessage = `Please set a Spread Integer value greater than 0 when item is Department 410 on Line: ${x + 1}.`;
                                let myMsg3 = message.create({
                                    title: 'Invalid Spread Integer',
                                    message: strErrorMessage,
                                    type: message.Type.ERROR,
                                    duration: 50000
                                });
                                myMsg3.show();
                                counter += 1
                            }
                        }
                    }
                }
                if (counter > 0){
                    return false;
                } else {
                    return true;
                }
            } catch (error) {
                console.log('Error: saveRecord', error.message)
            }
        }

        

        return {
            pageInit: pageInit,
            validateLine: validateLine,
            saveRecord: saveRecord,
        };

    });
