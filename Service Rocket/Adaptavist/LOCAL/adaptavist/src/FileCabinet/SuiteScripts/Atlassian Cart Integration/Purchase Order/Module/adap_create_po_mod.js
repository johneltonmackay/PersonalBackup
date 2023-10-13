/**
 * @NApiVersion 2.1
 */
define(['N/record', '../../Purchase Order/Mapping/adap_po_field_mapping.js',
        '../Library/adap_mod_handlebars.js', 'N/query', 'N/search', 'N/redirect', '../../Purchase Order/Module/adap_send_email_mod.js'],

    (record, mapper, modHandleBars, query, search, redirect, sendEmail) => {

        const createPO = (intInvoiceId) => {
            if (intInvoiceId) {
                // create PO if not existing
                let objInvoiceRecord = record.load({
                    type: record.Type.INVOICE,
                    id: parseInt(intInvoiceId),
                    isDynamic: true
                })
                let blnEmailSent = objInvoiceRecord.getValue({fieldId: 'custbody_adap_atl_email_sent'})
                if (!blnEmailSent) {
                    let intCreatedFromEstimate = objInvoiceRecord.getValue({fieldId: 'createdfrom'})
                    if (intCreatedFromEstimate) {
                        let arrAllCreatedPO = processEstimateRecord(intCreatedFromEstimate, intInvoiceId)
                        if (arrAllCreatedPO.length > 0) {
                            attachPOToRecords(objInvoiceRecord, arrAllCreatedPO)
                            objInvoiceRecord.save()
                        }
                    }
                }
            }
        }


        const processEstimateRecord = (intCreatedFromEstimate, intInvoiceId) => {
            try {
                let objEstimateRecord = record.load({
                    type: record.Type.ESTIMATE,
                    id: intCreatedFromEstimate,
                    isDynamic: true
                })

                //get subsidiary Vendor
                let intSubsidiary = objEstimateRecord.getValue({fieldId: 'subsidiary'})
                let intRepresentingVendor = getRepresentingVendor(intSubsidiary) //2120 //Atlassian Pty Ltd //getRepresentingVendor(intSubsidiary)

                let intItemCount = objEstimateRecord.getLineCount('item')
                let objLineMapping = mapper.objMapping.lineField

                //log.debug('objLineMapping', objLineMapping)
                let arrLineDetail = [];
                let arrAtlassianCart = []
                let i = 0;
                do {
                    //get all Atlasian Cart Associated with Estimate
                    let intAtlCartItem = objEstimateRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_adap_atl_cart_item',
                        line: i
                    });
                    if (intAtlCartItem) {
                        arrAtlassianCart.push(intAtlCartItem)
                    }
                    i++;
                } while (i < intItemCount);

                //get unique atlassian Cart
                let arrAtlassianCartUnique = [...new Set(arrAtlassianCart)];
                log.debug('arrAtlassianCart', arrAtlassianCart)
                log.debug('arrAtlassianCartUnique', arrAtlassianCartUnique)
                let arrAllCreatedPO = []
                if (arrAtlassianCartUnique.length > 0) {
                    arrLineDetail = getCartDetail(arrAtlassianCartUnique)
                    if (arrLineDetail.length > 0) {
                        arrAllCreatedPO = createPOFromEstimateAndCart(arrLineDetail, objEstimateRecord, intRepresentingVendor, intInvoiceId)
                    }
                }
                if (arrAllCreatedPO.length > 0) {
                    attachPOToRecords(objEstimateRecord, arrAllCreatedPO)
                }
                objEstimateRecord.save()
                return arrAllCreatedPO
            } catch (e) {
                log.audit('Issue with Creating PO : function processEstimateRecord', e.message)
            }
        }

        const attachPOToRecords = (objRecord, arrAllCreatedPO) => {
            let strQuery = 'select id, custbody_atl_cart_link from transaction where id in ({{ids}})'
            let strQueryPOCarts = modHandleBars.getResponse({
                templateContent: strQuery,
                data: {
                    ids: arrAllCreatedPO
                }
            });
            log.debug('strQueryPOCarts', strQueryPOCarts)

            let arrPOandCart = query.runSuiteQL({
                query: strQueryPOCarts
            }).asMappedResults();

            log.debug('arrPOandCart', arrPOandCart)

            let intEstimateLineCount = objRecord.getLineCount('item')
            for (let i = 0; i < intEstimateLineCount; i++) {
                let intCartId = objRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_adap_atlassian_cart_holder',
                    line: i
                })
                const objPODetail = arrPOandCart.find(obj => obj.custbody_atl_cart_link === parseInt(intCartId));
                log.debug('objPODetail', objPODetail)
                if (objPODetail) {
                    let currentLine = objRecord.selectLine({
                        sublistId: 'item',
                        line: i
                    })
                    currentLine.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ada_est_linked_po',
                        value: objPODetail.id
                    })
                    currentLine.commitLine('item')
                }
            }
        }

        const getCartDetail = (arrAtlassianCartUnique) => {
            let intCartLength = arrAtlassianCartUnique.length;
            let objLineMapping = mapper.objMapping.lineField;
            let arrLineDetails = [];
            for (let i = 0; i < intCartLength; i++) {
                let intCartId = arrAtlassianCartUnique[i]
                log.debug('intCartId', intCartId)
                let objCartLineDetail = {};
                let objAtlCartRecord = record.load({
                    type: 'customrecord_adap_atlassian_cart_item',
                    id: intCartId,
                    isDynamic: true
                })
                for (let strField in objLineMapping) {
                    let value = objAtlCartRecord.getValue({fieldId: strField});
                    //log.debug(strField, value);
                    objCartLineDetail[strField] = value;
                }
                arrLineDetails.push(objCartLineDetail)

            }
            log.debug('arrLineDetails', arrLineDetails)

            return arrLineDetails
        }


        const createPOFromEstimateAndCart = (arrLineDetail, objEstimateRecord, intRepresentingVendor, intInvoiceId) => {
            let arrAllCreatedPO = []
            const objGroupedPOData = arrLineDetail.reduce((result, item) => {
                const cartHolder = item.custrecord_adap_atl_cart_parent;
                if (!result[cartHolder]) {
                    result[cartHolder] = [];
                }
                result[cartHolder].push(item);
                return result;
            }, {});

            log.debug('objGroupedPOData', objGroupedPOData);
            for (let intAtlCart in objGroupedPOData) {
                let blnPOExisting = checkForExistingATLCartPO(intAtlCart)
                log.debug('blnPOExisting', blnPOExisting);
                if (!blnPOExisting) {
                    //Line Fields
                    let objLineMapping = mapper.objMapping.lineField
                    let arrLines = objGroupedPOData[intAtlCart]
                    //log.debug(intAtlCart, arrLines)

                    let objPORecord = record.create({
                        type: record.Type.PURCHASE_ORDER,
                        isDynamic: true
                    })


                    //Header Fields //trandate not include as its automatically set to current date
                    let objHeaderMapping = mapper.objMapping.headerField
                    objHeaderMapping.custbody_st_sales_reference = arrLines[0].atlassianCart;  //set the attlassian Cart Number as sales Reference
                    objHeaderMapping.custbody_atl_cart_link = intAtlCart;     //set cart Link
                    objHeaderMapping.custbody_atl_po_invoice = intInvoiceId; //set Invoice Link
                    if (intRepresentingVendor) {
                        objHeaderMapping.entity = intRepresentingVendor
                    }
                    log.debug('objHeaderMapping', objHeaderMapping)
                    for (let headerField in objHeaderMapping) {
                        //log.debug(headerField, objHeaderMapping[headerField])
                        objPORecord.setValue({
                            fieldId: headerField,
                            value: objHeaderMapping[headerField]
                        })
                    }

                    //create line items
                    let intLineCount = arrLines.length
                    let intLineIndex = 0
                    do {
                        objPORecord.selectNewLine('item')
                        for (let strField in objLineMapping) {
                            //log.debug(strField,arrLines[intLineIndex][strField])
                            objPORecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: objLineMapping[strField],
                                value: arrLines[intLineIndex][strField]
                            })

                        }
                        objPORecord.commitLine('item')
                        intLineIndex++
                    } while (intLineIndex < intLineCount);
                    let intPOID = objPORecord.save({
                        ignoreMandatoryFields: true
                    })
                    log.audit('intPOID', intPOID)
                    arrAllCreatedPO.push(intPOID)
                } else {
                    log.debug('Existing PO')
                }
            }
            log.audit('arrAllCreatedPO', arrAllCreatedPO)
            return arrAllCreatedPO
        }

        const checkForExistingATLCartPO = (intAtlCart) => {
            let blnIsExisting = false;
            let strQueryForExistingPO = modHandleBars.getResponse({
                templateContent: modHandleBars.getFileContent(mapper.objMapping.existingPOQuery),
                data: {
                    intAtlCartId: intAtlCart
                }
            });
            log.debug('strQueryForExistingPO', strQueryForExistingPO)

            let queryResultSet = query.runSuiteQL({
                query: strQueryForExistingPO
            }).asMappedResults();

            log.debug('queryResultSet', queryResultSet)
            if (queryResultSet.length > 0) {
                blnIsExisting = true
            }

            return blnIsExisting
        }


        const getRepresentingVendor = (intSubsidiary) => {
            if (intSubsidiary) {
                let objRepresentingVendor = search.lookupFields({
                    type: search.Type.SUBSIDIARY,
                    id: intSubsidiary,
                    columns: ['representingvendor']
                })
                log.debug('objRepresentingVendor', objRepresentingVendor)
                let intRepresentingVendor = (objRepresentingVendor.representingvendor)[0].value

                //remove comment when Vendor will be dynamically sourced
                //return intRepresentingVendor
            }
        }

        return {createPO}

    });
