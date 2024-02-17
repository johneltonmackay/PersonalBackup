/**
 * @NApiVersion 2.1
 */
define(["N/ui/serverWidget", "N/search", "N/query", "N/file", "N/record", "../Library/slmapping.js", 'N/runtime'],

    (serverWidget, search, query, file, record, slMapping, runtime) => {

        //#constants
        const FORM = {};
        const ACTIONS = {};

        //#global functions
        FORM.buildForm = (options) => {
            try {
                var objForm = serverWidget.createForm({
                    title: options.title,
                });
                log.debug('buildForm options', options)
                addButtons({
                    form: objForm,
                });
                addFields({
                    form: objForm
                });
                addSublistFields({
                    form: objForm,  
                    parameters: options.dataParam
                });

                objForm.clientScriptModulePath = slMapping.SUITELET.form.CS_PATH;

                return objForm;
            } catch (err) {
                log.error('ERROR_BUILD_FORM:', err.message)
            }
        }

        const addButtons = (options) => {
            try {
                options.form.addSubmitButton({
                    label: slMapping.SUITELET.form.buttons.SUBMIT.label,
                });

                for (let strBtnKey in slMapping.SUITELET.form.buttons) {
                    if (slMapping.SUITELET.form.buttons[strBtnKey].id) {
                        options.form.addButton(slMapping.SUITELET.form.buttons[strBtnKey])
                    }

                }

            } catch (err) {
                log.error("BUILD_FORM_ADD_BUTTONS_ERROR", err.message);
            }
        };
        const addFields = (options) => {
            try {
                for (var strKey in slMapping.SUITELET.form.fields) {
                    options.form.addField(slMapping.SUITELET.form.fields[strKey]);
                    var objField = options.form.getField({
                        id: slMapping.SUITELET.form.fields[strKey].id,
                        container: 'custpage_fieldgroup'
                    });
                    if (slMapping.SUITELET.form.fields[strKey].ismandatory) {
                        objField.isMandatory = true;
                    }
                    if (slMapping.SUITELET.form.fields[strKey].hasoption) {
                        for (var strKey in slMapping.SUITELET.form.selectOptions) {
                            objField.addSelectOption(slMapping.SUITELET.form.selectOptions[strKey]);
                        }
                    }
                }
            } catch (err) {
                log.error("BUILD_FORM_ADD_BODY_FILTERS_ERROR", err.message);
            }
        };

        const addSublistFields = (options) => {
            try {
                let sublist = options.form.addSublist({
                    id : 'custpage_sublist',
					type : serverWidget.SublistType.LIST,
					label : 'List of Transactions to Consolidate',
					tab: 'custpage_tabid'
                });
                for (var strKey in slMapping.SUITELET.form.sublistfields) {
                    sublist.addField(slMapping.SUITELET.form.sublistfields[strKey]);
                }

                let arrParam = options.parameters
                log.debug('addSublistFields arrParam', arrParam);
                if (arrParam){
                    let arrSearchResults = runSearch(arrParam)
                    arrSearchResults.forEach((data, index) => {
                        for (const key in data) {
                            let value = data[key];
                            sublist.setSublistValue({
                                id: key,
                                line: index,
                                value: value,
                            });
                        }
                    });
                }
            } catch (err) {
                log.error("BUILD_FORM_ADD_SUBLIST_ERROR", err.message);
            }
        }

        const runSearch = (arrParam) => {
            log.debug('runSearch started');
            try {
                let arrayData = JSON.parse(arrParam)
                log.debug('runSearch arrayData', arrayData);

                let arrSearchResults = []
                let strTransType = ''
                if (arrayData.length > 0){
                    let dataTransType = arrayData[0].custpage_trans_type
                    log.debug('runSearch dataTransType', dataTransType);
                    if (dataTransType == 'PR'){
                        strTransType = 'PurchReq'
                    } else if (dataTransType == 'SR'){
                        strTransType = 'TrnfrOrd'
                    }
                }
                log.debug('runSearch strTransType', strTransType);
                let objSavedSearch = search.create({
                    type: 'transaction',
                    filters: [
                        ['type', 'anyof', strTransType],
                        'AND',
                        ['mainline', 'is', 'T'],
                        'AND',
                        ['custbody_conso', 'is', 'F'],
                      ],
                    columns: [
                        search.createColumn({ name: 'internalid', label: 'custpage_view'}),
                        search.createColumn({ name: 'tranid', label: 'custpage_document_no'}),
                        search.createColumn({ name: 'trandate', label: 'custpage_date'}),
                    ],

                });

                if (arrayData.length > 0){
                    let stFromDate = arrayData[1].custpage_from_date
                    let stToDate = arrayData[2].custpage_to_date
                    let stFromLocation = arrayData[3].custpage_from_location
                    let stToLocation = arrayData[4].custpage_to_location
                    log.debug('stFromDate', stFromDate)
                    log.debug('stToDate', stToDate)
                    if (strTransType == 'PR'){
                        objSavedSearch.filters.push(
                            search.createFilter({
                                name:'status',
                                operator:'noneof',
                                values: ['PurchReq:A', 'PurchReq:C', 'PurchReq:E', 'PurchReq:G', 'PurchReq:H', 'PurchReq:R'],
                            })
                        )
                    } else if (strTransType == 'SR'){
                        objSavedSearch.filters.push(
                            search.createFilter({
                                name:'status',
                                operator:'noneof',
                                values: ['TrnfrOrd:H', 'TrnfrOrd:A'],
                            })
                        )
                    }
                    if (stFromDate && stToDate){
                        objSavedSearch.filters.push(
                            search.createFilter({
                                name:'trandate',
                                operator:'within',
                                values: [stFromDate, stToDate],
                            })
                        )
                    }
                }

                let searchResultCount = objSavedSearch.runPaged().count;
            
                if (searchResultCount !== 0) {
                    let pagedData = objSavedSearch.runPaged({ pageSize: 1000 });
            
                    for (let i = 0; i < pagedData.pageRanges.length; i++) {
                        let currentPage = pagedData.fetch(i);
                        let pageData = currentPage.data;
                        var pageColumns = currentPage.data[0].columns;
                        if (pageData.length > 0) {
                            for (let pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                let objData = {};
                                pageColumns.forEach(function (result) {
                                    let resultLabel = result.label;
                                    objData[resultLabel] = pageData[pageResultIndex].getValue(result)
                                })
                                arrSearchResults.push(objData);
                            }
                        }   
                    }
                }

            // console.log('runSearch arrSearchResults', JSON.stringify(arrSearchResults));
            return arrSearchResults;

            } catch (err) {
                log.error('Error: runSearch', err.message);
            }
        }


        return { FORM, ACTIONS }

    });
