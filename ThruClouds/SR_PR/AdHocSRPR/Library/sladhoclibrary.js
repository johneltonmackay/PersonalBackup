/**
 * @NApiVersion 2.1
 */
define(["N/ui/serverWidget", "N/search", "N/query", "N/file", "N/record", "../Library/slmapping.js", 'N/runtime', 'N/url', '../Library/globalcs.js', 'N/ui/message'],

    (serverWidget, search, query, file, record, slMapping, runtime, url, globalcs, message) => {

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

        ACTIONS.RunMR = (options) => {
            try {
                log.debug("UNDER DEVELOPMENT");
                log.debug("options", options);
                var objForm = options.form;
                objForm.clientScriptModulePath = slMapping.SUITELET.form.CS_PATH;
            } catch (err) {
                log.error('ERROR_RUN_MR:', err.message)
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
                            if (value){
                                if (key == 'custpage_view'){
                                    var strItemFulfilUrl = url.resolveRecord({
                                        recordType: data.custpage_recordtype,
                                        recordId: value
                                    });
                                    let recLink = `<a href='${strItemFulfilUrl}' target="_blank" rel="noopener noreferrer">${value}</a>`
                                    sublist.setSublistValue({
                                        id: key,
                                        line: index,
                                        value: recLink,
                                    });
                                } else {
                                    sublist.setSublistValue({
                                        id: key,
                                        line: index,
                                        value: value,
                                    });
                                }
                                
                            }
 
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

                let stFromDate = arrayData[1].custpage_from_date
                let stToDate = arrayData[2].custpage_to_date
                let stFromLocation = arrayData[3].custpage_from_location
                let stToLocation = arrayData[4].custpage_to_location
                log.debug('strTransType', strTransType)
                log.debug('stFromDate', stFromDate)
                log.debug('stToDate', stToDate)
                log.debug('stFromLocation', stFromLocation)
                log.debug('stToLocation', stToLocation)

                let filters = [
                    ['type', 'anyof', strTransType],
                    'AND',
                    ['mainline', 'is', 'T'],
                    'AND',
                    ['custbody_conso', 'is', 'F'],
                    'AND',
                    ['trandate', 'within', stFromDate, stToDate],
                ];

                if (strTransType == "PurchReq") {
                    filters.push('AND');
                    filters.push(['status', 'noneof', 'PurchReq:A', 'PurchReq:C', 'PurchReq:E', 'PurchReq:G', 'PurchReq:H', 'PurchReq:R']);
                    filters.push('AND');
                    filters.push(['formulatext: {location}', 'is', stFromLocation]);
                } else if (strTransType == "TrnfrOrd"){
                    filters.push('AND');
                    filters.push(['status', 'noneof', 'TrnfrOrd:H', 'TrnfrOrd:A']);
                    filters.push('AND');
                    filters.push(['formulatext: {location}', 'is', stFromLocation]);
                    filters.push('AND');
                    filters.push(['formulatext: {transferlocation}', 'is', stToLocation]);
                }

                log.debug('filters', filters)

                let objSavedSearch = search.create({
                    type: 'transaction',
                    filters: filters,
                    columns: [
                        search.createColumn({ name: 'internalid', label: 'custpage_view'}),
                        search.createColumn({ name: 'tranid', label: 'custpage_document_no'}),
                        search.createColumn({ name: 'trandate', label: 'custpage_date'}),
                        search.createColumn({ name: 'formulatext', formula: '{location}', label: 'custpage_from_location'}),
                        search.createColumn({ name: 'formulatext', formula: '{transferlocation}', label: 'custpage_to_location'}),
                        search.createColumn({ name: 'recordtype', label: 'custpage_recordtype'}),
                    ],

                });

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
            log.debug(`runSearch arrSearchResults ${Object.keys(arrSearchResults).length}`, arrSearchResults);
            return arrSearchResults;

            } catch (err) {
                log.error('Error: runSearch', err.message);
            }
        }


        return { FORM, ACTIONS }

    });
