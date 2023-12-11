/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */


/**
 * Script Name          : HBX EKT BERICHT MR
 * Author               : Vin Battad
 * Start Date           : 25th April 2023
 * Description          :
 * Version              : 2.1
 */

define([
    'N/runtime',
    '../library/hbx_mr_ekt_module'
    ],
    
    (runtime,modEKT) => {

        const getInputData = (inputContext) => {
            var intItemFulfillmentId = runtime.getCurrentScript().getParameter({name: 'custscript_hbx_ekt_if_id'});
            return modEKT.getStage(intItemFulfillmentId);
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
