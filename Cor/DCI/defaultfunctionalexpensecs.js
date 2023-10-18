/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', 'N/currentRecord'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{runtime} runtime
     * @param{currentRecord} currentRecord
     */
    function (record, search, runtime, currentRecord) {

        function pageInit(scriptContext) {
            console.log("pageInit", "TEST1")
        }

        function fieldChanged(scriptContext) {
            let strFieldChanging = scriptContext.fieldId;   
            if (strFieldChanging === 'department') {
                setData(scriptContext);
            }
            if (strFieldChanging === 'custcol_cseg_npo_program') {
                setData(scriptContext);
            }
        }
        function sublistChanged(scriptContext) {
            let sublistName = scriptContext.sublistId;
            if (sublistName === 'line') {
                setData(scriptContext);
            }
        }

        // PRIVATE FUNCTION

        function setData(scriptContext){
            try {
                let blnChecker;
                let objCurrentRecord = scriptContext.currentRecord;
                let sublistName = scriptContext.sublistId;
                let strAccountType = objCurrentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'accounttype'
                })
                console.log("strAccountType", strAccountType)
                if (strAccountType == 'Expense'){
                    let intDepartment = objCurrentRecord.getCurrentSublistValue({
                        sublistId: sublistName,
                        fieldId: 'department'
                    })
                    let intProgram = objCurrentRecord.getCurrentSublistValue({
                        sublistId: sublistName,
                        fieldId: 'custcol_cseg_npo_program'
                    })
                    console.log("department", intDepartment)
                    console.log("intProgram", intProgram)
                
                    if (intProgram){
                        blnChecker = 'program'
                        intFilterData = intProgram
                    } else {
                        blnChecker = 'department'
                        intFilterData = intDepartment
                    }
                    let arrSegmentCode = searchSegmentData(intFilterData, blnChecker)
                    if (arrSegmentCode.length > 0){
                        objCurrentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: 'custcol_npo_suitekey',
                            value: arrSegmentCode[0].name,
                            ignoreFieldChanged: true
                        });
                        objCurrentRecord.setCurrentSublistValue({
                            sublistId: sublistName,
                            fieldId: 'custcol_cseg_npo_exp_type',
                            value: arrSegmentCode[0].functionalExpenses,
                            ignoreFieldChanged: true
                        });
                    }
                }
            } catch (err) {
                log.error('searchRecord', err.message);
            }
            return true;
        }

        function searchSegmentData(intFilterData, blnChecker){
          let arrSegmentCode = [];
            try {
                let objSegmentSearch = search.create({
                    type: 'customrecord_npo_segment_code',
                    filters: (blnChecker === 'department') ? [
                        ['custrecord_sgdepartment.internalid', 'anyof', intFilterData]
                    ] : [
                        ['custrecord_41_cseg_npo_program.internalid', 'anyof', intFilterData]
                    ],
                    columns: [
                        search.createColumn({ name: 'internalid' }),
                        search.createColumn({ name: 'custrecord_41_cseg_npo_program' }),
                        search.createColumn({ name: 'custrecord_sgdepartment' }),
                        search.createColumn({ name: 'custrecord_41_cseg_npo_exp_type' }),
                        search.createColumn({ name: 'custrecord_41_cseg_npo_grant' })
                    ]
                });
                
                var searchResultCount = objSegmentSearch.runPaged().count;
                if (searchResultCount != 0) {
                    var pagedData = objSegmentSearch.runPaged({pageSize: 1000});
                    for (var i = 0; i < pagedData.pageRanges.length; i++) {
                        var currentPage = pagedData.fetch(i);
                        var pageData = currentPage.data;
                        if (pageData.length > 0) {
                            for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                arrSegmentCode.push({
                                    name: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                    department: pageData[pageResultIndex].getValue({name: 'custrecord_sgdepartment'}),
                                    program: pageData[pageResultIndex].getValue({name: 'custrecord_41_cseg_npo_program'}),
                                    functionalExpenses: pageData[pageResultIndex].getValue({name: 'custrecord_41_cseg_npo_exp_type'}),
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                log.error('searchRecord', err.message);
            }
            console.log("searchSegmentData", arrSegmentCode)
            log.debug("searchSegmentData", arrSegmentCode)
            return arrSegmentCode;
        }
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            sublistChanged: sublistChanged
        };

    });