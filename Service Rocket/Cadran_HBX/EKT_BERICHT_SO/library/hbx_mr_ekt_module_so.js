/**
 * @NApiVersion 2.1
 */

/**
 * Script Name          : MAP REDUCE MODULE
 * Author               : John Elton Mackay
 * Start Date           : January 2024
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

        MOD_MAP_REDUCE.getStage = (intSavedSearchId, intSenderId) => {
            try{
                log.debug('getStage:intSavedSearchId',intSavedSearchId)
                log.debug('getStage:intSenderId',intSenderId)
                var arrSavedSearchResults = loadSavedSearchId(intSavedSearchId) 
                arrSavedSearchResults.forEach(data => {
                    var objCustomerInfo = getCustomerEktTemplate(data)
                    // log.debug('objCustomerInfo',objCustomerInfo)
                    if(!objCustomerInfo.hasOwnProperty("errorMessage")){
                        data.customerInformation = objCustomerInfo
                        data.senderId = intSenderId
                        mapSOtoEktTemplate(data)
                    }
                });
                log.debug('getStage:arrSavedSearchResults', arrSavedSearchResults)
                return arrSavedSearchResults;
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
                        key: objData.customerInformation.salesOrderId,
                        value: objData
                    })
                }
            }
        }

        MOD_MAP_REDUCE.reduceStage = (options) => {
            var arrSOLines = [];
            var reduceValues = options.reduceValues;
            var intSalesOrderId = options.reduceKey;

            reduceValues.forEach(function (objData) {
                arrSOLines.push(JSON.parse(objData))
            })

            log.debug('reduceStage: intSalesOrderId',intSalesOrderId)
            log.debug('reduceStage: arrSOLines', arrSOLines)

            updateSOCheckBoxLines({
                salesOrderId:intSalesOrderId,
                salesOrderLines: arrSOLines
            })

        }

        /**
         * PRIVATE FUNCTIONS
         */


        /**
         * GET STAGE
         */

        const loadSavedSearchId = (intSavedSearchId) => {
            let arrSearchResults = [];
            let objSavedSearch = search.load({
                id: intSavedSearchId
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
                                objData['salesorderid'] = pageData[pageResultIndex].id
                            })
                            arrSearchResults.push(objData);
                        }
                    }   
                }
            }
            log.debug('loadSavedSearchId arrSearchResults', arrSearchResults)
            return arrSearchResults;
        };
        

        const getCustomerEktTemplate = (options) => {
            var intSalesOrderId = options.salesorderid;
            // log.debug('getCustomerEktTemplate intSalesOrderId:',intSalesOrderId)
            var objSalesOrder = search.lookupFields({
                type:search.Type.SALES_ORDER,
                id: intSalesOrderId,
                columns:['entity']
            });
            if (objSalesOrder){
                let customerId = objSalesOrder.entity[0].value
                var objReturn = {}
                var objCustomer = search.lookupFields({
                    type:search.Type.CUSTOMER,
                    id:customerId,
                    columns:['custentity_hbx_ekt_customer','custentity_hbx_ekt_message','custentity_hbx_ekt_email']
                });
                // log.debug('getCustomerEktTemplate objCustomer:', objCustomer)
                var blEktKlant = objCustomer.custentity_hbx_ekt_customer;
                var intEktTemplate = (objCustomer.custentity_hbx_ekt_message.length != 0) ? objCustomer.custentity_hbx_ekt_message[0].value : 0;
                var strCustomerEmail = objCustomer.custentity_hbx_ekt_email;

                if(blEktKlant && intEktTemplate != 0 && strCustomerEmail){
                    var objEktTemplate = getEktTemplateSearch(intEktTemplate)
                    objReturn['salesOrderId'] = intSalesOrderId;
                    objReturn['customerId'] = customerId;
                    objReturn['customerEmail'] = strCustomerEmail;
                    objReturn['ektKlant'] = blEktKlant;
                    objReturn['ektTemplateSearchId'] = objEktTemplate.ektTemplateSearchId;
                    objReturn['ektTemplate'] = objEktTemplate.ektTemplate;
                } else {
                    objReturn['errorMessage'] = 'Requirements for the customers that must be filled: EKT Klant, Ekt Template and Customer Email'
                }
            }
            
            return objReturn

        }
        const getEktTemplateSearch = (ektTemplateId) => {
            var objEktTemplateSearch = search.lookupFields({
                type:REC_EKT_TEMPLATE,
                id:ektTemplateId,
                columns:['custrecord_hbx_ekt_template_ss','custrecord_hbx_ekt_template_template']
            });
            // log.debug('getEktTemplateSearch: objEktTemplateSearch',objEktTemplateSearch)
            return {
                ektTemplateSearchId : (objEktTemplateSearch.custrecord_hbx_ekt_template_ss.length != 0) ? objEktTemplateSearch.custrecord_hbx_ekt_template_ss[0].value : 0,
                ektTemplate: objEktTemplateSearch.custrecord_hbx_ekt_template_template
            }
        }
        
        const mapSOtoEktTemplate = (objData) => {
            var ektMessage = objData.customerInformation.ektTemplate;
            for (var key in objData) {
                var regex = new RegExp(key, 'g');
                ektMessage = ektMessage.replace(regex, objData[key]);
                objData['ektMessage'] = ektMessage
            }
            // log.debug('mapSOtoEktTemplate objData',objData)
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
            var intSalesOrderId = objData.customerInformation.salesOrderId;
            var intCustomerId = objData.customerInformation.customerId;
            var intLine = objData.line
            var objEKTBeritchSearch = search.create({
                type:REC_EKT_BERICHT,
                filters:[
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
            // log.debug('createEKTBericht objData',objData)
            var intReturnId = 0;

            var intEktBeritch = searchEKTBericht(objData);
            // log.debug('intEktBeritch',intEktBeritch)
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
            log.debug('createEKTBericht objData: ',objData)
        }
        const sendEmail = (objData) => {
            try{
                let senderId = objData.senderId
                log.debug('sendEmail: senderId', senderId)
                var fileObj = file.load({
                    id: objData.fileId
                });
                email.send({
                    author: senderId,
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
                objData['sentEmail'] = true;
                log.debug('sendEmail: objData',objData)
            }catch (error) {
                log.error('error', error.message)
                objData['sentEmail'] = false;
                log.debug('sendEmail: objData',objData)
            }

        }

        /**
         * END OF MAP STAGE
         */

        /**
         * REDUCE STAGE
         */

        const updateSOCheckBoxLines = (options) => {
            var intSalesOrderId = options.salesOrderId;
            var arrSOLines = options.salesOrderLines;

            var recSalesOrder = record.load({
                type:record.Type.SALES_ORDER,
                id:intSalesOrderId,
                isDynamic:true
            });

            arrSOLines.forEach(function (soLineData) {
                var intLineSO = recSalesOrder.findSublistLineWithValue({
                    sublistId:'item',
                    fieldId:'line',
                    value:soLineData.line
                })
                log.debug('updateSOCheckBoxLines: intLineSO',intLineSO)
                if(intLineSO != -1){
                    recSalesOrder.selectLine({
                        sublistId:'item',
                        line:intLineSO
                    });
                    recSalesOrder.setCurrentSublistValue({
                        sublistId:'item',
                        fieldId:FLD_SO_EKT_CHECKBOX,
                        value:true
                    });
                    recSalesOrder.commitLine({sublistId:'item'})
                }
            });

            var intRecSalesOrderId = recSalesOrder.save({
                enableSourcing:true,
                ignoreMandatoryFields:true
            });
            log.debug('updateSOCheckBoxLines: intRecSalesOrderId',intRecSalesOrderId)
        }

        /**
         * END OF REDUCE STAGE
         */



        return MOD_MAP_REDUCE;

    });



