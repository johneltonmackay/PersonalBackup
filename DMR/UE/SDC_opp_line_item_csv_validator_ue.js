/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/error'],

    (record, search, error) => {
        const beforeSubmit = (scriptContext) => {
            log.debug("CONTEXT: ", scriptContext.type);
            let arrErrorMessages = []; // Array to store error messages
            let newRecord = scriptContext.newRecord;
            log.debug("beforeSubmit newRecord", newRecord)
            if (newRecord) {
                var numLines = newRecord.getLineCount({
                    sublistId: 'item'
                });
                log.debug("beforeSubmit numLines", numLines)
                if (numLines > 0) {
                    for (var i = 0; i < numLines; i++) {
                        let intSpreadInteger = newRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_sdc_spreadinterger',
                            line: i
                        });
                        let strDepartment = newRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'department',
                            line: i
                        });
                        log.debug("beforeSubmit intSpreadInteger", intSpreadInteger);
                        log.debug("beforeSubmit strDepartment", strDepartment);
                        if (strDepartment == "20") {
                            if (!intSpreadInteger) {
                                let strErrorMessage = `CSV Line: ${i + 1} - Please set a Spread Integer value greater than 0 when item is Department 410.`;
                                log.debug("beforeSubmit CSV Import ERROR", strErrorMessage);
                                if (!arrErrorMessages.includes(strErrorMessage)) {
                                    arrErrorMessages.push(strErrorMessage); // Adding error message to array if it's not already there
                                }
                            }
                        }
                    }
                }
            }
            log.debug("beforeSubmit arrErrorMessages", JSON.stringify(arrErrorMessages));
            if (arrErrorMessages.length > 0) {
                let mycustomError = error.create({       
                    name: 'CSV Line Validator',
                    message: 'CSV import failed due to errors. Error Messages: ' + JSON.stringify(arrErrorMessages)
                })

                throw mycustomError.message;
            }  
        };

        return { beforeSubmit };

    });
