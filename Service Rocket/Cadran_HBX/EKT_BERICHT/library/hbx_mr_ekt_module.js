/**
 * @NApiVersion 2.1
 */

/**
 * Script Name          : MAP REDUCE MODULE
 * Author               : Vin Battad
 * Start Date           : 25th April 2023
 * Description          :
 * Version              : 2.1
 */

define(['N/search','N/record','N/file','N/email','N/runtime'],

    (search,record,file,email,runtime) => {

        const MOD_MAP_REDUCE = {};
        const REC_EKT_BERICHT = 'customrecord_hbx_ekt_bericht';
        const REC_EKT_TEMPLATE = 'customrecord_hbx_ekt_template';
        const FOLDER_FILES_ID = '1450';
        const FLD_SO_EKT_CHECKBOX = 'custcol_hbx_ekt_so_regel_verstuurd';

        const LIN_ITEM_CODE = '{LIN_ITEM_CODE}';

        MOD_MAP_REDUCE.getStage = (itemFulfillmentId) => {
            try{
                log.debug('getStage:itemFulfillmentId',itemFulfillmentId)
                var arrIFEKT;
                var intCustomerId = getItemFulfillmentCustomer(itemFulfillmentId)
                var objCustomerInfo = getCustomerEktTemplate(intCustomerId)
                log.debug('objCustomerInfo',objCustomerInfo)
                if(!objCustomerInfo.hasOwnProperty("errorMessage")){
                    arrIFEKT = getItemFulfillments(objCustomerInfo);
                }
                return arrIFEKT;
            }catch (error) {
                log.error('getStage: error',error)
            }
        }

        MOD_MAP_REDUCE.mapStage = (options) => {
            var objData = options.objData;
            var mapContext = options.mapContext;
            log.debug('mapStage objData: ',objData)

            createFile(objData)
            createEKTBericht(objData)
            if(objData.ektBericht != 0){
                sendEmail(objData)
                if(objData.sentEmail){
                    mapContext.write({
                        key: objData.customerInformation.itemFulfillmentId,
                        value: objData
                    })
                }
            }
        }

        MOD_MAP_REDUCE.reduceStage = (options) => {
            var arrIfLines = [];
            var reduceValues = options.reduceValues;
            var intItemFulfillmentId = options.reduceKey;

            reduceValues.forEach(function (objData) {
                arrIfLines.push(JSON.parse(objData))
            })

            log.debug('reduceStage: intItemFulfillmentId',intItemFulfillmentId)
            log.debug('reduceStage: arrIfLines',arrIfLines)

            updateIFCheckBoxLines({
                itemFulfillmentId:intItemFulfillmentId,
                itemFulillmentLines: arrIfLines
            })

        }

        /**
         * PRIVATE FUNCTIONS
         */


        /**
         * GET STAGE
         */

        const getItemFulfillmentCustomer = (itemFulfillmentId) => {
            var objItemFulfillment = search.lookupFields({
                type:search.Type.ITEM_FULFILLMENT,
                id:itemFulfillmentId,
                columns:['entity','createdfrom']
            });
            log.debug('getItemFulfillmentCustomer objItemFulfillment:',objItemFulfillment)
            return {
                itemFulfillmentId : itemFulfillmentId,
                customerId:objItemFulfillment.entity[0].value,
                salesOrderId:objItemFulfillment.createdfrom[0].value,
            };
        }
        const getCustomerEktTemplate = (options) => {
            var intCustomerId = options.customerId;
            var intItemFulfillmentId = options.itemFulfillmentId;
            var intSalesOrderId = options.salesOrderId;

            var objReturn = {}
            var objCustomer = search.lookupFields({
                type:search.Type.CUSTOMER,
                id:intCustomerId,
                columns:['custentity_hbx_ekt_customer','custentity_hbx_ekt_message','custentity_hbx_ekt_email']
            });
            log.debug('getCustomerEktTemplate objCustomer:',objCustomer)
            var blEktKlant = objCustomer.custentity_hbx_ekt_customer;
            var intEktTemplate = (objCustomer.custentity_hbx_ekt_message.length != 0) ? objCustomer.custentity_hbx_ekt_message[0].value : 0;
            var strCustomerEmail = objCustomer.custentity_hbx_ekt_email;

            if(blEktKlant && intEktTemplate != 0 && strCustomerEmail){
                var objEktTemplate = getEktTemplateSearch(intEktTemplate)
                objReturn['itemFulfillmentId'] = intItemFulfillmentId;
                objReturn['salesOrderId'] = intSalesOrderId;
                objReturn['customerId'] = intCustomerId;
                objReturn['customerEmail'] = strCustomerEmail;
                objReturn['ektKlant'] = blEktKlant;
                objReturn['ektTemplateSearchId'] = objEktTemplate.ektTemplateSearchId;
                objReturn['ektTemplate'] = objEktTemplate.ektTemplate;
            }else{
                objReturn['errorMessage'] = 'Requirements for the customers that must be filled: EKT Klant, Ekt Template and Customer Email'
            }

            return objReturn

        }
        const getEktTemplateSearch = (ektTemplateId) => {
            var objEktTemplateSearch = search.lookupFields({
                type:REC_EKT_TEMPLATE,
                id:ektTemplateId,
                columns:['custrecord_hbx_ekt_template_ss','custrecord_hbx_ekt_template_template']
            });
            log.debug('getEktTemplateSearch: objEktTemplateSearch',objEktTemplateSearch)
            return {
                ektTemplateSearchId : (objEktTemplateSearch.custrecord_hbx_ekt_template_ss.length != 0) ? objEktTemplateSearch.custrecord_hbx_ekt_template_ss[0].value : 0,
                ektTemplate: objEktTemplateSearch.custrecord_hbx_ekt_template_template
            }
        }
        const getItemFulfillments = (options) => {
            var intEktTemplateSearchId = options.ektTemplateSearchId;
            var intItemFulfillmentId = options.itemFulfillmentId;

            var arrItemFulfillmentData = [];
            var objItemFulfillmentSearch = search.load({
                id:intEktTemplateSearchId
            })
            objItemFulfillmentSearch.filters.push(
                search.createFilter({
                    name:'internalid',
                    operator:'anyof',
                    values:[intItemFulfillmentId]
                })
            )
            var intIFCount = objItemFulfillmentSearch.runPaged().count;
            log.debug('getItemFulfillments intIFCount',intIFCount)
            if(intIFCount !== 0){
                var pagedData = objItemFulfillmentSearch.runPaged({pageSize: 1000});
                for (var i = 0; i < pagedData.pageRanges.length; i++) {
                    var currentPage = pagedData.fetch(i);
                    var pageData = currentPage.data;
                    var pageColumns = currentPage.data[0].columns;
                    if (pageData.length > 0) {
                        for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                            var objData = {}
                            objData['customerInformation'] = options;
                            pageColumns.forEach(function (result) {
                                switch (result.label){
                                    case LIN_ITEM_CODE:
                                        var objItem = search.lookupFields({
                                            type:search.Type.ITEM,
                                            id:pageData[pageResultIndex].getValue(result),
                                            columns:['itemid']
                                        });
                                        log.debug('objItem',objItem)
                                        objData[LIN_ITEM_CODE] = objItem.itemid;
                                        break;
                                    default:
                                        objData[result.label||result.name] = pageData[pageResultIndex].getValue(result);
                                }
                            })
                            arrItemFulfillmentData.push(objData)
                        }
                    }
                }
            }
            log.debug('getItemFulfillments: arrItemFulfillmentData',arrItemFulfillmentData)

            arrItemFulfillmentData.forEach(function (data) {
                mapSOtoEktTemplate(data)
            })

            return arrItemFulfillmentData;
        }
        const mapSOtoEktTemplate = (objData) => {
            var ektMessage = objData.customerInformation.ektTemplate;
            for (var key in objData) {
                var regex = new RegExp(key, 'g');
                ektMessage = ektMessage.replace(regex, objData[key]);
                objData['ektMessage'] = ektMessage
            }
            log.debug('mapSOtoEktTemplate objData',objData)
        }

        /**
         * END OF GET STAGE
         */

        /**
         * MAP STAGE
         */

        const generateGUID = () => {
            var dt = new Date().getTime();
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
                function( c ) {
                    var rnd = Math.random() * 16;//random number in range 0 to 16
                    rnd = (dt + rnd)%16 | 0;
                    dt = Math.floor(dt/16);
                    return (c === 'x' ? rnd : (rnd & 0x3 | 0x8)).toString(16);
                });
        }
        const createFile = (objData) => {
            var ektMessage = objData.ektMessage;
            var stGUID = generateGUID()
            var objFile = file.create({
                name:stGUID+'.edi',
                fileType:file.Type.PLAINTEXT,
                contents:ektMessage,
                folder:FOLDER_FILES_ID
            });
            var fileId = objFile.save();
            objData['fileId'] = fileId
        }

        const searchEKTBericht = (objData) => {
            var intReturnId = 0;
            var intItemFulfillmentId = objData.customerInformation.itemFulfillmentId;
            var intSalesOrderId = objData.customerInformation.salesOrderId;
            var intCustomerId = objData.customerInformation.customerId;
            var intLine = objData.line
            var objEKTBeritchSearch = search.create({
                type:REC_EKT_BERICHT,
                filters:[
                    ['custrecord_hbx_ekt_bericht_item_fulfill','is',intItemFulfillmentId],
                    "AND",
                    ['custrecord_hbx_ekt_bericht_transactie','is',intSalesOrderId],
                    "AND",
                    ['custrecord_hbx_ekt_bericht_klant','is',intCustomerId],
                    "AND",
                    ['custrecord_hbx_ekt_bericht_if_line','is',intLine]
                ],
                columns:['internalid']
            });
            var intEktBeritchCount = objEKTBeritchSearch.runPaged().count;
            if(intEktBeritchCount != 0){
                objEKTBeritchSearch.run().each(function (result) {
                    intReturnId = result.getValue('internalid')
                    return false;
                })
            }
            return intReturnId;
        }

        const createEKTBericht = (objData) => {
            log.debug('createEKTBericht objData',objData)
            var intReturnId = 0;

            var intEktBeritch = searchEKTBericht(objData);
            log.debug('intEktBeritch',intEktBeritch)
            var recEktBericht;
            if(intEktBeritch != 0){
                recEktBericht= record.load({
                    type:REC_EKT_BERICHT,
                    id:intEktBeritch
                });
            }else{
                recEktBericht= record.create({
                    type:REC_EKT_BERICHT
                });
            }

            recEktBericht.setValue({fieldId:'custrecord_hbx_ekt_bericht_transactie',value:objData.customerInformation.salesOrderId})
            recEktBericht.setValue({fieldId:'custrecord_hbx_ekt_bericht_item_fulfill',value:objData.customerInformation.itemFulfillmentId})
            recEktBericht.setValue({fieldId:'custrecord_hbx_ekt_bericht_klant',value:objData.customerInformation.customerId})
            recEktBericht.setValue({fieldId:'custrecord_hbx_ekt_bericht_email',value:objData.customerInformation.customerEmail})
            recEktBericht.setValue({fieldId:'custrecord_hbx_ekt_bericht_document',value:objData.fileId})
            recEktBericht.setValue({fieldId:'custrecord_hbx_ekt_bericht_if_line',value:objData.line})
            var intEktBerichtID = recEktBericht.save();

            if(intEktBerichtID){
                record.attach({
                    record: {
                        type: 'file',
                        id: objData.fileId
                    },
                    to: {
                        type: REC_EKT_BERICHT,
                        id: intEktBerichtID
                    }
                });
                intReturnId = intEktBerichtID;
            }
            objData['ektBericht'] = intReturnId
        }
        const sendEmail = (objData) => {
            try{
                var intCurrentUser = runtime.getCurrentUser().id;
                log.debug('sendEmail: intCurrentUser',intCurrentUser)
                var fileObj = file.load({
                    id: objData.fileId
                });
                email.send({
                    author: intCurrentUser,
                    recipients: objData.customerInformation.customerEmail, //objData.customer.email (NEED TO REPLACE IF THE TESTING IS DONE)
                    subject: 'CLOCKT;NETSUITE' + new Date().getTime(),
                    body: 'CLOCKT;NETSUITE' + new Date().getTime(),
                    attachments: [fileObj],
                    relatedRecords: {
                        customRecord:{
                        id: objData['ektBericht'],
                        recordType: REC_EKT_BERICHT
                        }
                    }
                });
                log.debug('emailSent',true)

                objData['sentEmail'] = true;
            }catch (error) {
                objData['sentEmail'] = false;
            }

        }

        /**
         * END OF MAP STAGE
         */

        /**
         * REDUCE STAGE
         */

        const updateIFCheckBoxLines = (options) => {
            var intItemFulfillmentId = options.itemFulfillmentId;
            var arrIfLines = options.itemFulillmentLines;

            var recItemFulfillment = record.load({
                type:record.Type.ITEM_FULFILLMENT,
                id:intItemFulfillmentId,
                isDynamic:true
            });

            arrIfLines.forEach(function (ifLineData) {
                var intLineIF = recItemFulfillment.findSublistLineWithValue({
                    sublistId:'item',
                    fieldId:'line',
                    value:ifLineData.line
                })
                log.debug('updateIFCheckBoxLines: intLineIF',intLineIF)
                if(intLineIF != -1){
                    recItemFulfillment.selectLine({
                        sublistId:'item',
                        line:intLineIF
                    });
                    recItemFulfillment.setCurrentSublistValue({
                        sublistId:'item',
                        fieldId:FLD_SO_EKT_CHECKBOX,
                        value:true
                    });
                    recItemFulfillment.commitLine({sublistId:'item'})
                }
            });

            var intRecItemFulfillmentId = recItemFulfillment.save({
                enableSourcing:true,
                ignoreMandatoryFields:true
            });
            log.debug('updateIFCheckBoxLines: intRecItemFulfillmentId',intRecItemFulfillmentId)
        }

        /**
         * END OF REDUCE STAGE
         */



        return MOD_MAP_REDUCE;

    });



