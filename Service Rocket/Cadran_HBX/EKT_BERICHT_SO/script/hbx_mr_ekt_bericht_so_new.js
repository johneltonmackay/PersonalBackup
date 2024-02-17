/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */


/**
 * Script Name          : HBX EKT BERICHT MR
 * Author               : John Elton Mackay
 * Start Date           : January 2024
 * Description          :
 * Version              : 2.1
 */

define([
    'N/runtime',
    '../library/hbx_mr_ekt_module_so'
    ],
    
    (runtime,modEKT) => {

        const getInputData = (inputContext) => {
            var intSavedSearchId = runtime.getCurrentScript().getParameter({name: 'custscript_saved_search_id'});
            var intSenderId = runtime.getCurrentScript().getParameter({name: 'custscript_sender_id'});
            return modEKT.getStage(intSavedSearchId, intSenderId);
        }

        const map = (mapContext) => {
            try{
                var objData = JSON.parse(mapContext.value);
                modEKT.mapStage({mapContext,objData});
            }catch (error) {
                log.error('map: error',error)
            }
        }

        const reduce = (reduceContext) => {
            try{
                var reduceKey = reduceContext.key;
                var reduceValues = reduceContext.values;
                modEKT.reduceStage({reduceKey,reduceValues});
            }catch (error) {
                log.error('reduce: error',error)
            }

        }


        return {
            getInputData:getInputData,
            map:map,
            reduce:reduce,
        }

    });
