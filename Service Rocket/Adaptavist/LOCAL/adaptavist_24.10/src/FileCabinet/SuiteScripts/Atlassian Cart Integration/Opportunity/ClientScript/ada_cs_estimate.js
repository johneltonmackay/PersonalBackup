/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['../Library/adap_estimate_lib.js', '../../Library/FieldAndValueMapper/adap_field_and_def_value_mapper.js',
    '../../Library/calculations/calculations.js', 'SuiteScripts/Atlassian Cart Integration/Purchase Order/Library/adap_mod_handlebars.js',
    '../../Library/SQL/adap_sql_library.js',
    'N/query', 'N/runtime'],
    /**
     * @param{format} format
     */
    (estimateLib, libMapper,
        libCalculations, modHandleBars,
        libSQL,
        query, runtime) => {
        var CURRENT_LINE = -1;
        var IS_ESTIMATE_NEW = false;
        const STR_TECH_NO_ADDRESS = 'Technical Contact Has no Address set to it.'
        const CANADA = 'Canada';
        const UNITED_STATES = 'United States';
        const INDIA = 'India';
        const LOCALSTORAGE_RECALCULATECONVERTION = 'recalculateConvertion'
        const objSublistFields = libMapper.estimateFields.sublist.item;
        const objBodyfields = libMapper.estimateFields.fields;
        /**
         * const to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        const pageInit = (scriptContext) => {
            try {
                localStorage.setItem(LOCALSTORAGE_RECALCULATECONVERTION, false);
                var button = document.getElementById('addcontact');

                if (button) {
                    // Attach a click event listener to the button
                    button.addEventListener('click', handleClickEvent);
                }
                curRecord = scriptContext.currentRecord;
                if (scriptContext.mode == 'create') {
                    curRecord.setValue({
                        fieldId: libMapper.estimateFields.fields.discountitem.id,
                        value: libMapper.estimateFields.fields.discountitem.default
                    })
                    // estimateLib.getCurrencyExchangeRateForNewRecord(curRecord);
                    IS_ESTIMATE_NEW = true
                }
                estimateLib.setCurrencyRate(curRecord, false);
            } catch (e) {
                console.log('pageInit | error', e)
            }

        }

        function handleClickEvent() {
            // Your custom logic to be executed when the button is clicked
            console.log('test')
            // Add more code here as needed
        }

        /**
         * const to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */

        const fieldChanged = (scriptContext) => {
            if (scriptContext.sublistId) {
                estimateLib.sublistFieldChange(scriptContext);
                estimateLib.setItemDescription(scriptContext);
                disableCurrencyField(scriptContext);
            } else {
                return estimateLib.bodyFieldChange(scriptContext);
            }
        }

        /**
         * const to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        const postSourcing = (scriptContext) => {
            console.log('postSourcing', scriptContext)
            return true
        }

        /**
         * const to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        const sublistChanged = (scriptContext) => {
            console.log('sublistChanged | scriptContext', scriptContext)
            var curRecord = scriptContext.currentRecord;
            if (scriptContext.sublistId == 'item') {
                libCalculations.estimateSummaryCalculation(curRecord);
            }
        }

        /**
         * const to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        var objOldLineValues = {}
        const lineInit = (scriptContext) => {
            console.log('lineInit', scriptContext)
            try {
                var objCurRecord = scriptContext.currentRecord;
                if (scriptContext.mode == 'create') {
                    objCurRecord.setValue({
                        fieldId: libMapper.estimateFields.fields.discountitem.id,
                        value: libMapper.estimateFields.fields.discountitem.default
                    })
                }
                estimateLib.disableSublistFields(objCurRecord);
                for (const fieldKey in objSublistFields) {
                    var field = objSublistFields[fieldKey];
                    objOldLineValues[fieldKey] = objCurRecord.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: field.id
                    });
                }
                disableCurrencyField(scriptContext);
                console.log('type ' + objOldLineValues + ' | objOldLineValues | lineInit', objOldLineValues)
            } catch (e) {
                console.log('lineInit Error |', e)
            }
        }

        const disableCurrencyField = (scriptContext) => {
            var objCurRecord = scriptContext.currentRecord;
            var intItemId = objCurRecord.getCurrentSublistValue({ sublistId: scriptContext.sublistId, fieldId: objSublistFields.itemId.id });
            var objCurrencyField = objCurRecord.getField({ fieldId: objBodyfields.currencyId.id })
            objCurrencyField.isDisabled = !!intItemId;
        }
        /**
         * Validation const to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        const validateField = (scriptContext) => {
            return true
        }


        /**
         * Validation const to be executed when sublist line is committed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        const validateLine = (scriptContext) => {
            var curRecord = scriptContext.currentRecord;
            var arrTestUsers = libMapper.arrTestUsers;
            if (arrTestUsers.includes(runtime.getCurrentUser().id)) {
                return estimateLib.validateLine({
                    curRecord,
                    scriptContext,
                    objOldLineValues,
                })
            }
            var objFields = libMapper.estimateFields.sublist.item;
            var blnReturnValue = false;

            var strDescription = curRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'description'
            })
            var CANNOT_RETRIEVE_DESCRIPTION_MESSAGE = 'Cannot retrieve item description'
            if (strDescription.length && strDescription != CANNOT_RETRIEVE_DESCRIPTION_MESSAGE) {

                for (const fieldKey in objFields) {
                    var field = objFields[fieldKey];
                    var ignoreFieldKeys = ['customerDiscountRate', 'avstTotal', 'margin', 'newListPrice_amount'];
                    if (field.type == 'currency' && !ignoreFieldKeys.includes(fieldKey)) {
                        var intNewValue = curRecord.getCurrentSublistValue({
                            sublistId: scriptContext.sublistId,
                            fieldId: field.id,
                            ignoreFieldChange: true
                        })
                        if (objOldLineValues[fieldKey] != intNewValue) {
                            var intValue = estimateLib.setCurrencyExchange({
                                sublistField: field.id,
                                curRecord: curRecord
                            });
                            curRecord.setCurrentSublistValue({
                                sublistId: scriptContext.sublistId,
                                fieldId: field.id,
                                value: libCalculations.toFixNumber(intValue)
                            });
                        }
                    }
                }
                console.log('objOldLineValues', objOldLineValues)

                var strCurrencySymbol = curRecord.getValue({
                    sublistId: 'item',
                    fieldId: 'currencysymbol'
                });

                if (strCurrencySymbol != 'USD') {
                    var fltCurrencyRate = libCalculations.toFixNumber(curRecord.getValue(libMapper.estimateFields.fields.toUsdConversion.id) || 0);
                    var fltCurrencyBuffer = libCalculations.toFixNumber(curRecord.getValue(libMapper.estimateFields.fields.currencyBuffer.id) || 0);
                    var intDiscountPercent = curRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: libMapper.estimateFields.sublist.item.customerDiscountRate.id
                    });
                    var fltNewListPrice = ((curRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: libMapper.estimateFields.sublist.item.newListPrice.id
                    }) || 0) / fltCurrencyRate) * (1 + (fltCurrencyBuffer / 100));

                    var fltConvertedNewListPrice = curRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: libMapper.estimateFields.sublist.item.newListPrice.id
                    });

                    var fltCustomerDiscount = (fltNewListPrice * (intDiscountPercent / 100)) * fltCurrencyRate

                    var fltBufferedCustomerDiscount = fltCustomerDiscount / (1 + (fltCurrencyBuffer / 100));

                    var fltConvertedAvstDiscountAmount = curRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: libMapper.estimateFields.sublist.item.avstDiscountAmount.id
                    });

                    curRecord.setCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: libMapper.estimateFields.sublist.item.customerDiscountAmount.id,
                        value: libCalculations.toFixNumber(fltBufferedCustomerDiscount),
                        ignoreFieldChange: true,
                        ignoreRecalc: true,
                    });

                    curRecord.setCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: libMapper.estimateFields.sublist.item.avstTotal.id,
                        value: libCalculations.toFixNumber(fltConvertedNewListPrice - fltConvertedAvstDiscountAmount),
                        ignoreFieldChange: true,
                        ignoreRecalc: true,
                    });

                    curRecord.setCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: libMapper.estimateFields.sublist.item.avstTotal.id,
                        value: libCalculations.toFixNumber(fltConvertedNewListPrice - fltConvertedAvstDiscountAmount),
                        ignoreFieldChange: true,
                        ignoreRecalc: true,
                    });

                    curRecord.setCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: libMapper.estimateFields.sublist.item.customerPrice.id,
                        value: libCalculations.toFixNumber(fltConvertedNewListPrice - fltBufferedCustomerDiscount),
                        ignoreFieldChange: true,
                        ignoreRecalc: true,
                    });

                }

                var avstTotal = curRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: libMapper.estimateFields.sublist.item.avstTotal.id
                })

                var customerPrice = curRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: libMapper.estimateFields.sublist.item.customerPrice.id
                })

                var margin = customerPrice - avstTotal;

                var intNewListPrice_amount = curRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: libMapper.estimateFields.sublist.item.newListPrice.id
                });

                curRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: libMapper.estimateFields.sublist.item.margin.id,
                    value: libCalculations.toFixNumber(margin || 0),
                    ignoreFieldChange: true
                });
                curRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: libMapper.estimateFields.sublist.item.newListPrice_amount.id,
                    value: intNewListPrice_amount,
                    ignoreFieldChange: true
                });

                console.log('settingSummaryValue');
                libCalculations.estimateSummaryCalculation(curRecord);
                blnReturnValue = true
            } else {
                alert('Please enter a value for Description');
            }
            return blnReturnValue
        }
        /**
         * Validation const to be executed when sublist line is inserted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        const validateInsert = (scriptContext) => {
            console.log('validateInsert | scriptContext', scriptContext)
            var curRecord = scriptContext.currentRecord
            if (scriptContext.sublistId == 'item') {
                libCalculations.estimateSummaryCalculation(curRecord);
            }
            return true
        }

        /**
         * Validation const to be executed when record is deleted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        const validateDelete = (scriptContext) => {
            console.log('validateDelete | scriptContext', scriptContext)
            var curRecord = scriptContext.currentRecord
            if (scriptContext.sublistId == 'item') {
                libCalculations.estimateSummaryCalculation(curRecord);
            }
            return true
        }

        /**
         * Validation const to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        const saveRecord = (scriptContext) => {
            let objEstimate = scriptContext.currentRecord
            // logics are inside the function
            let objIsValidAddress = updateShipAndBillAddress(objEstimate, false)
            log.debug('objIsValidAddress', objIsValidAddress)
            if (objIsValidAddress.isValid) {
                return true
            } else {
                alert(objIsValidAddress.missingAddress)
                return false
            }

        }

        const checkIfEndUserToUse = (objEstimate) => {
            let arrPresentAddress = [];
            const fieldMappings = {
                "custbody_adap_enduser_name": "Company Name",
                "custbodyadap_enduser_address1": "Address1",
                "custbody_adap_enduser_city": "City",
                "custbody_adap_enduser_zip": "Zip",
                "custbody_adap_enduser_country": "Country",
                "custbody_adap_enduser_state": "State"
            };

            for (let endUserField in fieldMappings) {
                let strValue = objEstimate.getValue(endUserField)
                if (strValue) {
                    arrPresentAddress.push(fieldMappings[endUserField])
                }
            }
            return arrPresentAddress.length > 0;

        }


        const updateShipAndBillAddress = (objEstimate, blnOverride) => {
            try {
                let blnIsValidAddress = true;
                let strMissingAddress = '';
                let objEndUserAddFields = libMapper.endUserAddress;
                let blnIsEndUser = checkIfEndUserToUse(objEstimate)
                //log.debug('blnIsEndUser', blnIsEndUser)
                let blnIsPartner = objEstimate.getValue('custbody_adap_enduser_ispartner')
                let blnTechContactAddress = objEstimate.getValue('custbody_adap_override_cust_add')
                //log.debug('blnIsPartner', blnIsPartner)
                if (blnTechContactAddress) {
                    updateAddressFromTechContact(objEstimate)
                    // } else if ((intEndUserCountry || strAddress)) {
                } else if (blnIsEndUser) {
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
                    //log.debug('objAddressDetail before Short Name', objAddressDetail)

                    //validation for incomplete end user address
                    let exceptions = libMapper.payloadException;
                    if (objAddressDetail.country === UNITED_STATES || objAddressDetail.country === INDIA || objAddressDetail.country === CANADA) {
                        exceptions = exceptions.filter(item => item !== "state");
                    }
                    exceptions.push("addr2")
                    let arrMissingAddressKey = [];
                    for (let addressKey in objAddressDetail) {
                        if (!exceptions.includes(addressKey) && objAddressDetail[addressKey] === "") {
                            arrMissingAddressKey.push(addressKey);
                        }
                    }
                    log.debug('arrMissingAddressKey', arrMissingAddressKey)
                    if (arrMissingAddressKey.length > 0) {
                        strMissingAddress = 'Missing End User Client Address Detail:'
                        const objMissingAddressLabel = {
                            country: "Country",
                            state: "State",
                            addressee: "Company Name",
                            addr1: "Address1",
                            city: "City",
                            zip: "Zip"
                        }
                        for (let missingAddress of arrMissingAddressKey) {
                            strMissingAddress += '\n *' + objMissingAddressLabel[missingAddress]
                        }

                        blnIsValidAddress = false
                    } else {


                        objAddressDetail.country = getCountryShortName(objAddressDetail.country)
                        objAddressDetail.state = getStateShortName(objAddressDetail.state)
                        log.debug('objAddressDetail', objAddressDetail)


                        let arrSubRecord = libMapper.addressSubRecord
                        for (let subRecord of arrSubRecord) {
                            updateAddressBook(objEstimate, objAddressDetail, subRecord, blnOverride, strAddress)
                        }
                    }
                } else if (blnIsPartner) {
                    updateBillAddressDefault(objEstimate, blnOverride)
                } else {
                    //update address as default billing if no override checked
                    updateBillAddressDefault(objEstimate, blnOverride)
                }
                return { isValid: blnIsValidAddress, missingAddress: strMissingAddress }
            } catch (e) {
                log.error('error setting Ship and Bill address base on End User Address', e.message)
            }
        }

        const updateAddressFromTechContact = (objEstimate) => {
            let strTechContactName = objEstimate.getValue('custbody_atl_tech_contact_name')
            let strTechContactEmail = objEstimate.getValue('custbody_atl_tech_contact_email')
            let strGetTechContactAddress = libSQL.sqlQuery.getTechnicalContactAddress
            strGetTechContactAddress = strGetTechContactAddress.replace('{{name}}', strTechContactName)
            strGetTechContactAddress = strGetTechContactAddress.replace('{{email}}', strTechContactEmail)
            log.debug('strGetTechContactAddress ', strGetTechContactAddress)

            let arrTechContactAddress = query.runSuiteQL({
                query: strGetTechContactAddress
            }).asMappedResults();
            log.debug('arrTechContactAddress ', arrTechContactAddress)
            if (arrTechContactAddress.length > 0) {
                let objAddressDetail = {
                    country: arrTechContactAddress[0].country,
                    state: arrTechContactAddress[0].shortname,
                    addressee: arrTechContactAddress[0].addressee,
                    addr1: arrTechContactAddress[0].addr1,
                    addr2: null,
                    city: arrTechContactAddress[0].city,
                    zip: arrTechContactAddress[0].zip,
                }

                let strAddress = formatAddress(objAddressDetail)
                objEstimate.setValue('custbody_atl_tech_contact_address', strAddress)
                objAddressDetail.country =  getCountryShortName(arrTechContactAddress[0].country)
                let arrSubRecord = libMapper.addressSubRecord
                for (let subRecord of arrSubRecord) {
                    updateAddressBook(objEstimate, objAddressDetail, subRecord, false, strAddress)
                }
            } else {
                objEstimate.setValue('custbody_atl_tech_contact_address', STR_TECH_NO_ADDRESS)
            }
        }

        const updateBillAddressDefault = (objNewEstimate, blnOverride) => {
            // let objNewEstimate = scriptContext.newRecord
            let intCustomer = objNewEstimate.getValue('entity')
            let strGetDefaultAddress = libSQL.sqlQuery.getCustomerDefaultBillAdd
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
                        let objBillFields = libMapper.defaultBillAddress
                        for (let fields in objBillFields) {
                            objBillDetails[fields] = objAddressDetail[objBillFields[fields]]
                        }
                    }
                    if (objAddressDetail.defaultshipping == true) {
                        let objShipFields = libMapper.defaultShipAddress
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


                let arrSubRecord = libMapper.addressSubRecord
                for (let subRecord of arrSubRecord) {
                    let objAddressDetail;
                    if (subRecord == 'shippingaddress') {
                        objAddressDetail = objShipDetails
                        strAddress = formatAddress(objAddressDetail['shipaddress'])
                    } else if (subRecord == 'billingaddress') {
                        objAddressDetail = objBillDetails
                        strAddress = formatAddress(objAddressDetail['billaddress'])
                    }
                    updateAddressBook(objNewEstimate, objAddressDetail, subRecord, blnOverride, strAddress)
                }
            }
        }

        const getStateShortName = (state) => {
            let strQuery = libSQL.sqlQuery.getStateName
            strQuery = strQuery.replace('{state}', state)
            let arrQueryResult = query.runSuiteQL({
                query: strQuery
            }).asMappedResults();
            if (arrQueryResult.length > 0) {
                return arrQueryResult[0].shortname
            }
        }
        const getCountryShortName = (country) => {
            let strQuery = libSQL.sqlQuery.getCountryShortName
            strQuery = strQuery.replace('{country}', country)
            let arrQueryResult = query.runSuiteQL({
                query: strQuery
            }).asMappedResults();
            if (arrQueryResult.length > 0) {
                return arrQueryResult[0].id
            }
        }
        const updateAddressBook = (objEstimate, objAddressDetail, strSubRecord, blnOverride, strAddress) => {
            var objSubrecord = objEstimate.getSubrecord({ fieldId: strSubRecord });
            log.debug('objAddressDetail', objAddressDetail)
            for (let addrField in objAddressDetail) {
                if (addrField == 'billaddress' || addrField == 'shipaddress') {
                    // log.debug('not included', addrField)
                } else {
                    log.debug('addrField:', addrField + ' : ' + objAddressDetail[addrField])
                    if (objAddressDetail[addrField]) {
                        objSubrecord.setValue({
                            fieldId: addrField,
                            value: objAddressDetail[addrField]
                        })
                    }
                }
            }
            if (objAddressDetail['state']) {
                objSubrecord.setValue({
                    fieldId: 'state',
                    value: objAddressDetail['state']
                })
            }
            objSubrecord.setValue({
                fieldId: 'override',
                value: false
            })

        }

        function formatAddress(addressObj) {
            let strAddress = '';
            let arrAddressSequence = ['addressee', 'addr1', 'city', 'state', 'zip', 'country']
            for (let addrField of arrAddressSequence) {
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


        return {
            pageInit,
            fieldChanged,
            // postSourcing,
            sublistChanged,
            lineInit,
            // validateField,
            validateLine,
            validateInsert,
            validateDelete,
            saveRecord
        };

    });
