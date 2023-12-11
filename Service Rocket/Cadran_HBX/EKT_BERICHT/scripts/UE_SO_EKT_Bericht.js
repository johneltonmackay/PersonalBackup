/**
*@NApiVersion 2.1
*@NScriptType UserEventScript
*/

/**
* Script Name          :
* Author               : Vin Battad
* Start Date           : 19th April 2023
* Last Modified Date   :
* Discription          : Create EKT Bericht Custom record on IF save.
* Version              : 2.1
* updates              : 
*/

define(['N/record','N/search','N/task'], (record, search, task) => {

    const afterSubmit = (context) => {
        try{
            if(context.type === 'create' || context.type === 'edit'){
                var recNew = context.newRecord;
                var intItemFulfillmentId = recNew.id;
                log.debug('afterSubmit: intItemFulfillmentId ',intItemFulfillmentId)
                var intCustomerId = recNew.getValue('entity');
                if(intCustomerId){
                    var objCustomer = search.lookupFields({
                        type:search.Type.CUSTOMER,
                        id:intCustomerId,
                        columns:[
                            'custentity_hbx_ekt_customer',
                            'custentity_hbx_ekt_message',
                            'custentity_hbx_ekt_email'
                        ]
                    });
                    log.debug('afterSubmit: objCustomer',objCustomer)

                    var blCustomerEktKlant = objCustomer.custentity_hbx_ekt_customer;
                    var arrCustomerEktMessage = objCustomer.custentity_hbx_ekt_message;
                    var strCustomerEktEmail = objCustomer.custentity_hbx_ekt_email;

                    if(blCustomerEktKlant && (arrCustomerEktMessage.length !== 0) && strCustomerEktEmail){
                        task.create({
                            taskType:task.TaskType.MAP_REDUCE,
                            scriptId: 'customscript_hbx_ekt_bericht_mr',
                            params:{
                                'custscript_hbx_ekt_if_id':intItemFulfillmentId
                            }
                        }).submit();
                        log.debug('afterSubmit: Task Message','Called Map/Reduce')
                    }

                }
            }
        }
        catch(err){
            log.debug('afterSubmit Error: ', err.message);
        }
    }

    return{
        afterSubmit
    }

})