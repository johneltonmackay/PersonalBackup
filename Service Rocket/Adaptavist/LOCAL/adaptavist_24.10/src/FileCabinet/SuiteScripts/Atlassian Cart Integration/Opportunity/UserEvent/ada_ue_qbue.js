/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
/*
    ID					: customscript_
    Name				: [SR] QB Display
    Purpose				: show button for atlassian
    Client Script       : ../ClientScript/ada_cs_qbcs.js
    Created On			: April 23, 2023
    Author				: Ceana Technology
    Script Type			: Map/Reduce Script
*/
define(['N/ui/serverWidget',
    '../../Library/FieldAndValueMapper/adap_field_and_def_value_mapper.js', '../../Library/SQL/adap_sql_library.js', '../../Library/saveSearch.js', '../Library/adap_estimate_lib.js', './lib/ada_ue_update_sub_records.js'],
    (serverWidget,
        libMapper, libSuitesQl, savedSearch, estimateLib, libUpdateSubRecordLib) => {

        const METHOD_CREATE = 'create';
        const beforeLoad = (scriptContext) => {
            try {
                var objForm = scriptContext.form;
                var objRec = scriptContext.newRecord;
                var strUuid = "";
                var intEstId = '';
                var intCartId = undefined;
                var blnIsCart = objRec.type == libMapper.atlassianCart.id;
                var blnIsEstRecord = objRec.type == 'estimate';
                var blnIsQuoted = -1;
                var intMacAccount = 1;
                var strAtlLabel = blnIsEstRecord ? 'New Atlassian Cart' : 'Update Atlassian Cart'
                const QUOTED_STATUS = 3;


                if (blnIsCart) {
                    log.debug('Cart')
                    strUuid = objRec.getValue({
                        fieldId: libMapper.atlassianCart.fields.cartUuid.id
                    });

                    intEstId = objRec.getValue({
                        fieldId: libMapper.atlassianCart.fields.cartEstimate.id
                    });

                    blnIsQuoted = objRec.getValue({
                        fieldId: 'custrecord_adap_at_quote_status'
                    });

                    intCartId = objRec.id

                    if (!intEstId) {
                        intEstId = "''"
                    }
                    var arrMacAccount = libSuitesQl.search({
                        type: 'getEstimate',
                        params: {
                            id: intEstId,
                        }
                    })
                    if (arrMacAccount.length) {
                        intMacAccount = arrMacAccount[0].mac;
                    }

                    if (blnIsQuoted != QUOTED_STATUS) {
                        objForm.addButton({
                            id: 'custpage_atlassian_generate_quotemr',
                            label: 'Generate Quote',
                            functionName: `generateQuote({uuid:"${strUuid}", estid:${intEstId}, cartId:${intCartId}, isEstRecord:${blnIsEstRecord}, macAccount:${intMacAccount}})`
                        });
                    }

                } else {
                    var objSublistFields = libMapper.estimateFields.sublist.item

                    var objSublist = objForm.getSublist({
                        id: 'item'
                    });
                    var objCurrencyField = objSublist.getField({
                        id: objSublistFields.currency.id
                    });

                    objCurrencyField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                    var objUnfixedValuesField = objSublist.getField({
                        id: objSublistFields.unfixedValues.id
                    });

                    // objUnfixedValuesField.updateDisplayType({
                    //     displayType: serverWidget.FieldDisplayType.HIDDEN
                    // });

                    intEstId = objRec.id
                    strUuid = objRec.getValue({
                        fieldId: libMapper.uuid.id
                    });
                    intMacAccount = objRec.getValue({
                        fieldId: libMapper.estimateFields.fields.macAccount.id
                    });
                }


                if (scriptContext.type == 'view') {

                    var arrInvoice = savedSearch.ssearch({
                        type: 'isInvoiceExist',
                        filters: [
                            ["createdfrom", "anyof", objRec.id],
                            "AND",
                            ["mainline", "is", "T"],
                            "AND",
                            ["type", "is", "CustInvc"]
                        ]
                    });

                    var hasOpenQuote = libSuitesQl.search({
                        type: 'getRefreshQuote',
                        params: {
                            estid: objRec.id,
                        }
                    });

                    var hasOpenOrder = libSuitesQl.search({
                        type: 'hasOpenOrder',
                        params: {
                            estid: objRec.id,
                        }
                    });

                    strMRTaskID = objRec.getValue({
                        fieldId: libMapper.estimateFields.fields.refreshQuoteStatus.id
                    }) || '';


                    if (hasOpenOrder.length || !hasOpenQuote || arrInvoice.length || strMRTaskID.includes('MAPREDUCETASK')) {
                        objForm.removeButton({
                            id: 'createinvoice',
                        });
                        objForm.removeButton({
                            id: 'createcashsale',
                        });
                        objForm.removeButton({
                            id: 'createsalesord',
                        });

                        if (strMRTaskID.includes('MAPREDUCETASK')) {
                            objForm.removeButton({
                                id: 'edit',
                            });
                        }
                    }

                    if (!arrInvoice.length && !strMRTaskID.includes('MAPREDUCETASK')) {
                        if (blnIsQuoted == 1) {
                            objForm.addButton({
                                id: 'custpage_atlassian_cart',
                                label: strAtlLabel,
                                functionName: `atlassiancart({uuid:"${strUuid}", estid:${intEstId}, cartId:${intCartId}, isEstRecord:${blnIsEstRecord}, macAccount:${intMacAccount}})`
                            });
                        }

                        if (blnIsEstRecord) {
                            objForm.addButton({
                                id: 'custpage_atlassian_cart',
                                label: strAtlLabel,
                                functionName: `atlassiancart({uuid:"${strUuid}", estid:${intEstId}, cartId:${intCartId}, isEstRecord:${blnIsEstRecord}, macAccount:${intMacAccount}})`
                            });
                            objForm.addButton({
                                id: 'custpage_get_atlassian_quote',
                                label: 'Import Atlassian Quote',
                                functionName: `getAtlassianQuote({estid: ${intEstId}, macAccount:${intMacAccount}})`
                            });

                            if (hasOpenOrder.length) {
                                objForm.addButton({
                                    id: 'custpage_atlassian_generate_quotemr',
                                    label: 'Generate Quote',
                                    functionName: `generateQuote({uuid:"${strUuid}", estid:${intEstId}, cartId:${intCartId}, isEstRecord:${blnIsEstRecord}, macAccount:${intMacAccount}})`
                                });
                            }

                            if (hasOpenQuote.length) {
                                objForm.addButton({
                                    id: 'custpage_refresh_quote',
                                    label: 'Refresh Quote',
                                    functionName: `getRefreshQuote({estid:${intEstId}, macAccount:${intMacAccount}})`
                                });
                            }

                        }
                    }
                }

                if (scriptContext.type == METHOD_CREATE) {
                    if (blnIsEstRecord) {
                        objForm.addButton({
                            id: 'custpage_atlassian_cart',
                            label: strAtlLabel,
                            functionName: `atlassiancart({uuid:"${strUuid}", estid:${intEstId}, cartId:${intCartId}, isEstRecord:${blnIsEstRecord}, isNewEstRecord:${true}, macAccount:${intMacAccount}})`
                        });

                        objForm.addButton({
                            id: 'custpage_get_atlassian_quote',
                            label: 'Import Atlassian Quote',
                            functionName: `getAtlassianQuote({estid: ${intEstId}, isNewEstRecord:${true}})`
                        });
                    }
                }

                try {
                    if (scriptContext.type == 'edit') {
                        var objMacAccount = objForm.getField('custbody_adap_atl_mac_account');
                        objMacAccount.updateDisplayType({
                            displayType: 'disabled'
                        })
                    }
                    objForm.clientScriptModulePath = '../ClientScript/ada_cs_qbcs.js';
                } catch (e) {
                    log.error('beforeLoad | error: ', e)
                }

            } catch (e) {
                log.error('beforeLoad | error: ', e)
            }
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            var objNewRecord = scriptContext.newRecord;
            estimateLib.setTermsAndConditions(objNewRecord);
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            if (scriptContext.type == 'edit') {
                libUpdateSubRecordLib.updateATLItemRecords({ scriptContext })
            }
        }

        return { beforeLoad, beforeSubmit, afterSubmit }
    });