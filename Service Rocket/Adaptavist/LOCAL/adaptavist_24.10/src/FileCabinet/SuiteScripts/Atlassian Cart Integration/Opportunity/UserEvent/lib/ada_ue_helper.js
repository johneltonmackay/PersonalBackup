/**
 * @NApiVersion 2.1
 */
define(['N/search', 'N/ui/message', 'N/https', 'N/query', 'N/record', './ada_ue_validations_mapper.js',
        'SuiteScripts/Atlassian Cart Integration/Purchase Order/Library/adap_mod_handlebars.js',
        'N/redirect', '../../../Library/integrator/integrator.js', '../../../Library/NotifAndErrorMessage/adap_notif_error_msg.js',
        '../../../Library/SQL/adap_sql_library.js', '../../../Library/FieldAndValueMapper/adap_field_and_def_value_mapper.js'],

    (search, message, https, query, record, MAPPER, modHandleBars, redirect,
     integrator,notifAndErrorMsgHelper,libSQL,libFieldAndDefaultValue) => {

        let objEstimateSublistFields = libFieldAndDefaultValue.estimateFields.sublist.item
        //check if Cart is existing in Estimate
        const checkCartExistEstimate = (options) => {
            let isExisting = false;
            let objExistingAndCartId = {};
            log.debug('checkCartExistEstimate', options)
            if (options.orderNumber != 'null') {
                //log.audit('options checkCartExistEstimate', options)
                let strGetCartByName =libSQL.sqlQuery.getAtlCartByName
                let strQueryForEstimateCart = modHandleBars.getResponse({
                    templateContent: strGetCartByName,
                    data: {
                        name: options.orderNumber
                    }
                });
                log.audit('strQueryForEstimateCart checkCartExistEstimate', strQueryForEstimateCart)
                let arrEstimateCarts = query.runSuiteQL({
                    query: strQueryForEstimateCart
                }).asMappedResults();
                log.audit('arrEstimateCarts checkCartExistEstimate', arrEstimateCarts)
                if (arrEstimateCarts.length > 0) {
                    let intCartId = arrEstimateCarts[0].id
                    objExistingAndCartId.cartid = intCartId
                    if (options.estimate != 'null') {
                        //log.audit('arrEstimateCarts intCartId', intCartId)
                        let objEstimate = loadDynamicEstimate(parseInt(options.estimate))
                        //log.audit('objEstimate', objEstimate.id)
                        let intItemCount = objEstimate.getLineCount('item')
                        for (let i = 0; i < intItemCount; i++) {
                            let intEstimateCart = objEstimate.getSublistValue({
                                sublistId: libFieldAndDefaultValue.sublists.item,
                                fieldId: libFieldAndDefaultValue.estimateFields.sublist.item.cartId.id,
                                line: i
                            })
                            log.debug(intEstimateCart,intCartId)
                            if (intEstimateCart == intCartId) {
                                isExisting = true
                            }
                        }
                    }
                }
            }
            objExistingAndCartId.cartExistInEst = isExisting
            log.debug('objExistingAndCartId isExisting', objExistingAndCartId)
            return objExistingAndCartId
        }


        //adding and attaching contacts to estimate
        const updateTechContactHeaderField = (objEstRecord) => {
            let strTechContactNameField = libFieldAndDefaultValue.estimateFields.fields.techContactName.id
            let strTechContactEmailField = libFieldAndDefaultValue.estimateFields.fields.techContactEmail.id
            let strTechContactNameHeader = objEstRecord.getValue(strTechContactNameField)
            let strTechContactEmailHeader = objEstRecord.getValue(strTechContactEmailField)
            //log.debug(strTechContactNameHeader,strTechContactEmailHeader)
            let arrAllEstimateContact = getEstimateContacts(objEstRecord.id)
            let match = false;
            let objContactHighestInternalId = {};
            if (arrAllEstimateContact.length > 0) {
                match = arrAllEstimateContact.find(item => item.id === strTechContactNameHeader && item.email === strTechContactEmailHeader);
                // If no match is found, select the entry with the highest internalid
                objContactHighestInternalId = arrAllEstimateContact.reduce((max, item) => {
                    if (parseInt(item.internalid) > parseInt(max.internalid)) {
                        return item;
                    }
                    return max;
                }, arrAllEstimateContact[0]);
            } else {
                objContactHighestInternalId = {id: '', email: ''};
            }
            if (match) {
                log.debug("Match found:", match);
            } else {
                log.debug("No match found. Entry with highest internalid:", objContactHighestInternalId);
                let objEstimate = record.load({
                    type: record.Type.ESTIMATE,
                    id: parseInt(objEstRecord.id),
                    isDynamic: true,
                })

                let strCurrentSetEmail = objEstimate.getValue(strTechContactEmailField)
                let strCurrentSetName = objEstimate.getValue(strTechContactNameField)
                objEstimate.setValue({
                    fieldId: strTechContactNameField,
                    value: objContactHighestInternalId.id,
                })
                objEstimate.setValue({
                    fieldId: strTechContactEmailField,
                    value: objContactHighestInternalId.email,
                })
                let intSavedEstimate = objEstimate.save({ignoreMandatoryFields: true})
                if (strCurrentSetEmail && strCurrentSetName) {
                    redirect.toRecord({
                        type:record.Type.ESTIMATE,
                        id:objEstRecord.id
                    })
                }

                //check if the values on record context is still not reflected
                if (arrAllEstimateContact.length > 0 && (!strTechContactNameHeader || !strTechContactEmailHeader)) {
                    redirect.toRecord({
                        type:record.Type.ESTIMATE,
                        id:objEstRecord.id
                    })
                }
            }

        }
        const getEstimateContacts = (estimateId) => {
            let arrAllEstimateContact = [];
            var contactSearchObj = technicalContactSearch(estimateId)
            contactSearchObj.run().each(function (result) {
                let objResultFields = {
                    id: "entityid",
                    email: "email",
                    firstname: "firstname",
                    lastname: "lastname",
                    internalid: "internalid"
                }
                let objResultData = {}
                for (let field in objResultFields) {
                    objResultData[field] = result.getValue({
                        name: objResultFields[field],
                        summary: "GROUP"
                    });
                }
                arrAllEstimateContact.push(objResultData)
                return true;
            });
            log.debug('arrAllEstimateContact', arrAllEstimateContact)
            return arrAllEstimateContact
        }
        const technicalContactSearch = (estimateId) => {
            var contactSearchObj = search.create({
                type: "contact",
                filters:
                    [
                        ["transaction.internalidnumber", "equalto", estimateId]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "entityid",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "company",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "company"
                        }),
                        search.createColumn({
                            name: "email",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "email"
                        }),
                        search.createColumn({
                            name: "firstname",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "email"
                        }),
                        search.createColumn({
                            name: "lastname",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "email"
                        }),
                        search.createColumn({
                            name: "internalid",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "internalid"
                        }),
                    ]
            });
            return contactSearchObj
        }

        //button Function Validation and Notif Messages





        const validateEndUserDetail = (scriptContext) => {
            let objEstimateRecord = scriptContext.newRecord;
            let objForm = scriptContext.form
            let objEndUserFields = MAPPER.endUserAddress;
            let blnUseEndUser = false;
            let blnMissingDetail = false;
            let objAddressDetail = {};
            for (let strEndUserField in objEndUserFields) {
                //log.debug('strEndUserField',strEndUserField)
                let fieldValue = objEstimateRecord.getValue(strEndUserField)
                if (fieldValue) {
                    blnUseEndUser = true;
                    objAddressDetail[strEndUserField] = fieldValue
                }
            }
            // log.debug('objAddressDetail', objAddressDetail)
            // log.debug('objEndUserFields', objEndUserFields)
            delete objEndUserFields.custbody_enduser_address2;
            delete objEndUserFields.custbody_adap_enduser_state;
            // log.debug('objEndUserFields after delete', objEndUserFields)
            if (blnUseEndUser) {
                for (let strFieldsInAddDetail in objEndUserFields) {
                    if (strFieldsInAddDetail != 'custbody_enduser_address2') {
                        let fieldValueOnRecord = objAddressDetail[strFieldsInAddDetail]
                        if (!fieldValueOnRecord) {
                            log.debug('!fieldValueOnRecord', strFieldsInAddDetail)
                            blnMissingDetail = true
                        }
                    }
                }
                if (blnMissingDetail) {
                    hideButtonAndShowMessage(notifAndErrorMsgHelper.objMessages.generateQuoteEndUserAddress, objForm)
                }
            }
        }



        const validateRunningMR = (scriptContext) => {
            let objRecord = scriptContext.newRecord

            let strMRTask = objRecord.getValue({
                fieldId: 'custbody_adap_atl_refresh_status'
            }) || ''
            if (strMRTask) {
                if (strMRTask.includes('MAPREDUCETASK')) {
                    hideAllAttlasianButton(scriptContext.form)
                }
            }

        }




        const hideAllAttlasianButton = (objForm) => {
            let arrButtons = MAPPER.atlassianButtons
            for (let button of arrButtons) {
                let objQuoteButton = objForm.getButton({
                    id: button
                })
                if (objQuoteButton) {
                    objQuoteButton.isHidden = true
                }
            }

        }
        const hideButtonAndShowMessage = (objMessageDetail, objForm) => {
            let objMessage = message.create({
                title: objMessageDetail.title,
                message: objMessageDetail.message,
                type: objMessageDetail.type
            });
            objMessage.show();
            objForm.addPageInitMessage({message: objMessage});
            if (objMessageDetail.button) {
                let objRefreshQuoteButton = objForm.getButton({
                    id: objMessageDetail.button
                })
                if (objRefreshQuoteButton) {
                    objRefreshQuoteButton.isHidden = objMessageDetail.buttonHidden
                }
            }
        }


        //cart Line and Item Deletion Functions
        const UpdateEstimateAtlCartAndItem = (arrEstimateCarts, arrNewRecordItems) => {
            //log.debug('arrEstimateCarts.length', arrEstimateCarts.length)
            for (let intEstimateIndex = 0; intEstimateIndex < arrEstimateCarts.length; intEstimateIndex++) {
                let intAtlCartId = arrEstimateCarts[intEstimateIndex].id
                if (intAtlCartId) {
                    // log.debug('intAtlCartId', intAtlCartId)
                    let arrCartItems = getAtlCartItems(intAtlCartId)

                    if (arrCartItems.length > 0) {
                        for (let intItemIndex = 0; intItemIndex < arrCartItems.length; intItemIndex++) {
                            deleteCartItem(arrCartItems[intItemIndex].id, arrNewRecordItems)
                        }
                        let arrCartItemsAfterProcessing = getAtlCartItems(intAtlCartId)
                        if (arrCartItemsAfterProcessing.length < 1) {
                            //  log.debug('arrCartItemsAfterProcessing.length', arrCartItemsAfterProcessing.length)
                            deleteRecord(libFieldAndDefaultValue.atlassianCart.id, intAtlCartId, 'Cart')
                        }
                    } else {
                        deleteRecord(libFieldAndDefaultValue.atlassianCart.id, intAtlCartId, 'Cart')
                    }
                }
            }

        }

        const getAtlCartItems = (intAtlCartId) => {
            if (intAtlCartId) {
                //  log.debug('intAtlCartId', intAtlCartId)
                let strGetCartItemSQL = libSQL.sqlQuery.getAtlCartItems
                let strQueryForCartItem = modHandleBars.getResponse({
                    templateContent: strGetCartItemSQL,
                    data: {
                        id: intAtlCartId
                    }
                });
                // log.debug('strQueryForCartItem', strQueryForCartItem)
                let arrCartItems = query.runSuiteQL({
                    query: strQueryForCartItem
                }).asMappedResults();
                //  log.debug('arrCartItems', arrCartItems)

                return arrCartItems
            }
        }
        const deleteCartItem = (intCartItemId, arrNewRecordItems) => {
            const isPresent = arrNewRecordItems.some(item => item.cartItem === intCartItemId);
            // log.debug(`found ${JSON.stringify(intCartItemId)}`, isPresent)
            if (!isPresent) {
                //MAPPER.netsuiteCart.id
                deleteRecord(libFieldAndDefaultValue.atlassianCartItem.id, intCartItemId, 'Cart item')
            }

        }

        const deleteRecord = (strRecType, intRecId, strMessage) => {
            let intDeletedRecId = record.delete({
                type: strRecType,
                id: intRecId
            })
            log.audit(`Deleted ${strMessage}`, intDeletedRecId)
        }

        const getLineDetails = (objRecord, intRecLineCount) => {
            let arrLineDetails = []
            let objFieldsForUpdate = libFieldAndDefaultValue.estimateAtlassianCartUpdateFields
            // log.debug('objFieldsForUpdate', objFieldsForUpdate)
            for (let intRecIndex = 0; intRecIndex < intRecLineCount; intRecIndex++) {
                let objLineDetail = {}
                for (let strFieldKey in objFieldsForUpdate) {
                    let intValue = objRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: objFieldsForUpdate[strFieldKey],
                        line: intRecIndex
                    })
                    objLineDetail[strFieldKey] = parseInt(intValue)
                }
                arrLineDetails.push(objLineDetail)
            }
            return arrLineDetails;
        }


        const loadDynamicEstimate = (id) => {
            let objEstRecord = record.load({
                type: record.Type.ESTIMATE,
                id: id,
                isDynamic: true
            })
            return objEstRecord
        }

        const updateMaintenancePeriod = (estimate) => {

            try {
                //log.audit('updateMaintenancePeriod', estId)
                log.debug('updateMaintenancePeriod', estimate)
                var objDynamicEstimate={};
                if (typeof estimate == 'object') {
                    objDynamicEstimate = estimate
                } else if (typeof estimate == 'number' || typeof estimate == 'string') {
                    objDynamicEstimate = loadDynamicEstimate(estimate)
                }
                if (estimate) {
                    let intItemCount = objDynamicEstimate.getLineCount('item');
                    for (let intItemIndex = 0; intItemIndex < intItemCount; intItemIndex++) {
                        let dteEndDate = objDynamicEstimate.getSublistValue({
                            sublistId: libFieldAndDefaultValue.sublists.item,
                            fieldId: objEstimateSublistFields.endDate.id,
                            line: intItemIndex
                        })
                        let dteStartDate = objDynamicEstimate.getSublistValue({
                            sublistId: libFieldAndDefaultValue.sublists.item,
                            fieldId: objEstimateSublistFields.startDate.id,
                            line: intItemIndex
                        })
                        let intMaintenanceMonth = objDynamicEstimate.getSublistValue({
                            sublistId: libFieldAndDefaultValue.sublists.item,
                            fieldId: objEstimateSublistFields.maintenanceMonths.id,
                            line: intItemIndex
                        })
                        if (dteEndDate && dteStartDate && !intMaintenanceMonth) {
                            let dteExpDate = new Date(dteEndDate)
                            let dteCreatedDate = new Date(dteStartDate)
                            intMaintenanceMonth = (dteExpDate.getFullYear() - dteCreatedDate.getFullYear()) * 12 + (dteExpDate.getMonth() - dteCreatedDate.getMonth());
                            log.debug('intMaintenanceMonth', intMaintenanceMonth)
                            let currentLine = objDynamicEstimate.selectLine({
                                sublistId: libFieldAndDefaultValue.sublists.item,
                                line: intItemIndex
                            })
                            currentLine.setCurrentSublistValue({
                                sublistId: libFieldAndDefaultValue.sublists.item,
                                fieldId:objEstimateSublistFields.maintenanceMonths.id,
                                value: parseInt(intMaintenanceMonth),
                            })
                            currentLine.commitLine(libFieldAndDefaultValue.sublists.item)
                        }

                    }
                    if (typeof estimate == 'number' || typeof estimate == 'string') {
                        objDynamicEstimate.save()
                    }
                }
            } catch (e) {
                log.error('error Updating Maintenance Period', e.message)
            }
        }
        const updateShipAndBillAddress = (objEstimate, blnOverride) => {
            try {
                let objEndUserAddFields = libFieldAndDefaultValue.endUserAddress;
                let intEndUserCountry = objEstimate.getValue('custbody_adap_enduser_country')
                let strAddress = objEstimate.getValue('custbodyadap_enduser_address1')

                let blnIsPartner = objEstimate.getValue('custbody_adap_enduser_ispartner')
                log.debug('blnIsPartner', blnIsPartner)
                if ((intEndUserCountry || strAddress) && !blnIsPartner) {
                    let objAddressDetail = {};
                    for (let strField in objEndUserAddFields) {
                        let fieldValue
                        if (strField == 'custbody_adap_enduser_country' || strField == 'custbody_adap_enduser_state') {
                            fieldValue = objEstimate.getText(strField)
                            //log.debug(objEndUserAddFields[strField], strField + ':' + fieldValue)
                            objAddressDetail[objEndUserAddFields[strField]] = fieldValue
                        } else {
                            fieldValue = objEstimate.getValue(strField)
                            //log.debug(objEndUserAddFields[strField], strField + ':' + fieldValue)
                            objAddressDetail[objEndUserAddFields[strField]] = fieldValue
                        }
                    }


                     let strAddress = formatAddress(objAddressDetail)



                    objAddressDetail.country = getCountryShortName(objAddressDetail.country)
                    objAddressDetail.state = getStateShortName(objAddressDetail.state)
                    //objAddressDetail.addrtext = strAddress
                    // objAddressDetail.override = false;
                    log.debug('objAddressDetail', objAddressDetail)
                    let arrSubRecord = libFieldAndDefaultValue.addressSubRecord
                    for (let subRecord of arrSubRecord) {
                        updateAddressBook(objEstimate, objAddressDetail, subRecord, blnOverride,strAddress)
                    }
                    //set the Shipping and Billing text for PDF
                    // // log.debug('strAddress', strAddress)
                    // objEstimate.setValue('shipaddress', strAddress)
                    // objEstimate.setValue('billaddress', strAddress)

                } else {
                    updateBillAddressDefault(objEstimate, blnOverride)
                }
            } catch (e) {
                log.error('error setting Ship and Bill address base on End User Address', e.message)
            }
        }


        const updateBillAddressDefault = (objNewEstimate, blnOverride) => {
            // let objNewEstimate = scriptContext.newRecord
            let intCustomer = objNewEstimate.getValue('entity')
            let strGetDefaultAddress =libSQL.sqlQuery.getCustomerDefaultBillAdd
            let strQueryForAddress = modHandleBars.getResponse({
                templateContent: strGetDefaultAddress,
                data: {
                    customerId: intCustomer
                }
            });
            log.debug('strQueryForAddress', strQueryForAddress)
            let arrDefaultAddress = query.runSuiteQL({
                query: strQueryForAddress
            }).asMappedResults();
            log.debug('arrDefaultAddress', arrDefaultAddress)
            if (arrDefaultAddress.length > 0) {
                let objShipDetails = {}
                let objBillDetails = {}
                for (let objAddressDetail of arrDefaultAddress) {
                    if (objAddressDetail.defaultbilling == true) {
                        let objBillFields = libFieldAndDefaultValue.defaultBillAddress
                        for (let fields in objBillFields) {
                            objBillDetails[fields] = objAddressDetail[objBillFields[fields]]
                        }
                    }
                    if (objAddressDetail.defaultshipping == true) {
                        let objShipFields = libFieldAndDefaultValue.defaultShipAddress
                        for (let fields in objShipFields) {
                            objShipDetails[fields] = objAddressDetail[objShipFields[fields]]
                        }
                    }
                }
                //set the Shipping and Billing text for PDF
               let strAddress = ''
                // objNewEstimate.setValue({fieldId: 'shipaddress', value: objShipDetails['shipaddress']})
                // objNewEstimate.setValue({fieldId: 'billaddress', value: objBillDetails['billaddress']})

                objBillDetails.country = getCountryShortName(objBillDetails.country)
                objShipDetails.country = getCountryShortName(objShipDetails.country)



                let arrSubRecord = libFieldAndDefaultValue.addressSubRecord
                for (let subRecord of arrSubRecord) {
                    let objAddressDetail;
                    if (subRecord == 'shippingaddress') {
                        objAddressDetail = objShipDetails
                         strAddress = formatAddress(objAddressDetail['shipaddress'])
                    } else if (subRecord == 'billingaddress') {
                        objAddressDetail = objBillDetails
                        strAddress = formatAddress(objAddressDetail['billaddress'])
                    }
                    updateAddressBook(objNewEstimate, objAddressDetail, subRecord, blnOverride,strAddress)
                }


            }
        }

        const getStateShortName = (state) => {
            let strQuery =libSQL.sqlQuery.getStateName
            strQuery = strQuery.replace('{state}',state)
            let arrQueryResult = query.runSuiteQL({
                query: strQuery
            }).asMappedResults();
            if (arrQueryResult.length > 0) {
                return arrQueryResult[0].shortname
            }
        }
        const getCountryShortName = (country) => {
            let strQuery =libSQL.sqlQuery.getCountryShortName
            strQuery = strQuery.replace('{country}',country)
            let arrQueryResult = query.runSuiteQL({
                query: strQuery
            }).asMappedResults();
            if (arrQueryResult.length > 0) {
                return arrQueryResult[0].id
            }
        }
        const updateAddressBook = (objEstimate, objAddressDetail, strSubRecord, blnOverride,strAddress) => {
            var objSubrecord = objEstimate.getSubrecord({fieldId: strSubRecord});
            log.debug('objAddressDetail',objAddressDetail)
            for (let addrField in objAddressDetail) {
                if (addrField == 'billaddress' || addrField == 'shipaddress') {
                    // log.debug('not included', addrField)
                } else {
                     log.debug(addrField, objAddressDetail[addrField])
                    objSubrecord.setValue({
                        fieldId: addrField,
                        value: objAddressDetail[addrField]
                    })
                }
            }
            objSubrecord.setValue({
                fieldId: 'state',
                value: objAddressDetail['state']
            })
            //addrtext
            // objSubrecord.setValue({
            //     fieldId: 'override',
            //     value: true
            // })
            objSubrecord.setValue({
                fieldId: 'override',
                value: false
            })
            // objSubrecord.setValue({
            //     fieldId: 'addrtext',
            //     value: strAddress
            // })


        }

        function formatAddress(addressObj) {
            let strAddress = '';
            for (let addrField in addressObj) {
                if (addressObj[addrField]) {
                    if (addrField == 'city' || addrField == 'state') {
                        strAddress += addressObj[addrField] + ' '
                    } else {
                        strAddress += addressObj[addrField] + '\n'
                    }
                }
            }
            return strAddress;
        }

        const updateCartItemMaintenancePeriod = (objRecord) => {
            log.debug('updateCartItemMaintenancePeriod')
            let intItemCount = objRecord.getLineCount('item')
            for (let i = 0; i < intItemCount; i++) {
                let intCartItem = objRecord.getSublistValue({
                    sublistId: libFieldAndDefaultValue.sublists.item,
                    fieldId: objEstimateSublistFields.cartitemid.id,
                    line: i
                })
                log.debug('intCartItem',intCartItem)
                if (intCartItem) {
                    let dteStartDate = objRecord.getSublistValue({
                        sublistId: libFieldAndDefaultValue.sublists.item,
                        fieldId: objEstimateSublistFields.startDate.id,
                        line: i
                    })
                    let dteEndDate = objRecord.getSublistValue({
                        sublistId: libFieldAndDefaultValue.sublists.item,
                        fieldId: objEstimateSublistFields.endDate.id,
                        line: i
                    })
                    let intMaintenanceMonth = objRecord.getSublistValue({
                        sublistId: libFieldAndDefaultValue.sublists.item,
                        fieldId: objEstimateSublistFields.maintenanceMonths.id,
                        line: i
                    })
                    let objCartItemStartEndDate = {
                        custrecord_adap_atl_item_startdate: dteStartDate,
                        custrecord_adap_atl_item_enddate: dteEndDate,
                        custrecord_adap_atl_maintenance_month: intMaintenanceMonth
                    }
                    record.submitFields({
                        type: libFieldAndDefaultValue.atlassianCartItem.id,
                        id: intCartItem,
                        values: objCartItemStartEndDate
                    })

                }
            }
        }

        return {
            getLineDetails,
            UpdateEstimateAtlCartAndItem,
            loadDynamicEstimate,
            hideButtonAndShowMessage,
            updateTechContactHeaderField,
            checkCartExistEstimate,
            updateMaintenancePeriod,
            validateEndUserDetail,
            validateRunningMR,
            updateShipAndBillAddress,
            updateCartItemMaintenancePeriod,
            technicalContactSearch,
            hideAllAttlasianButton
        }

    });
