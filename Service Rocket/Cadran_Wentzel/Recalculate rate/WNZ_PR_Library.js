/**
 * @NModuleScope Public
 * @NApiVersion 2.x
 */
define([], function()
{
	
	function runSearch(search, recType, searchId, filters, columns) {
            var srchObj = null;
            if (searchId == null || searchId == '')
                srchObj = search.create({
                    type: recType,
                    filters: filters,
                    columns: columns
                });
            else {
                srchObj = search.load({
                    id: searchId
                });

                var existFilters = srchObj.filters;
                var existColumns = srchObj.columns;

                existFilters = (existFilters == null || existFilters == '') ? new Array() : existFilters;
                existColumns = (existColumns == null || existColumns == '') ? new Array() : existColumns;
                if (filters != null && filters != '') {
                    existFilters = filters;
                }
                if (columns != null && columns != '') {
                    for (var idx = 0; idx < columns.length; idx++)
                        existColumns.push(columns[idx]);
                }

                srchObj.filterExpression = existFilters;
                srchObj.columns = existColumns;
            }

            var resultSet = srchObj.run();

            return resultSet;
    }

	function searchGrossDayPrice(search, dDate, itemId, customerId) {
		
		var SEARCH_GROSS_DAY_PRICE = "customsearch_wnz_ocp_gross_day_price_pr";
		
        var objGross = search.load({
            id : SEARCH_GROSS_DAY_PRICE
        });
        
        objGross.filters.push(search.createFilter({
            name : "custrecord_wnz_pur_vendor",
            join : null,
            operator : 'anyof',
            values : customerId
        }));

        objGross.filters.push(search.createFilter({
            name : "custrecord_wnz_pur_item_gross_price",
            join : null,
            operator : 'anyof',
            values : itemId
        }));

        objGross.filters.push(search.createFilter({
            name : "custrecord_wnz_pur_price_date",
            join : null,
            operator : 'on',
            values : dDate
        }));

		return objGross;
	
	}
	
	function searchGrossDayPriceHistory(search, dDate, itemId) {
		
		var SEARCH_GROSS_DAY_PRICE = "customsearch_wnz_ocp_gross_day_his_pr";
		
        var objGross = search.load({
            id : SEARCH_GROSS_DAY_PRICE
        });

        objGross.filters.push(search.createFilter({
            name : "custrecord_wnz_pur_item_gross_price_his",
            join : null,
            operator : 'anyof',
            values : itemId
        }));

        objGross.filters.push(search.createFilter({
            name : "custrecord_wnz_pur_price_date_his",
            join : null,
            operator : 'on',
            values : dDate
        }));

		return objGross;
	
	}
	
	function showMantle(stMessage)
	{
		document.getElementById('div_filter_menu').style['top'] = '35%';
		document.getElementById('div_filter_menu').style['left'] = '35%';
		document.getElementById('div_filter_menu').style['z-index'] = '15000';
		document.getElementById('div_filter_menu').style['width'] = '450px';
		document.getElementById('div_filter_menu_bg').style['z-index'] = '14000';
		document.getElementById('div_filter_menu_bg').style['width'] = '100%';
		document.getElementById('loading_msg').innerHTML = '<b><i>'+stMessage+'</b>';
	}
	
	function hideMantle()
	{
		document.getElementById('div_filter_menu').style['top'] = '0';
		document.getElementById('div_filter_menu').style['left'] = '0';
		document.getElementById('div_filter_menu').style['z-index'] = '-15000';
		document.getElementById('div_filter_menu').style['width'] = '0';
		document.getElementById('div_filter_menu_bg').style['z-index'] = '-14000';
		document.getElementById('div_filter_menu_bg').style['width'] = '0';
	}
	
	function alertSuccess(result) {
            console.log('Success with value: ' + result)
    }

    function alertFailure(reason) {
            console.log('Failure: ' + reason)
    }
    
    function forceFloat(stValue) {
        var flValue = parseFloat(stValue);

        if (isNaN(flValue)) {
            return 0.00;
        }

        return flValue;
    }
    
	function convNull(value) {
		if (value == null || value == undefined)
			value = '';
		return value;
	}
	
    
	function isEmpty(obj) {
			for(var key in obj) {
				if(obj.hasOwnProperty(key))
					return false;
			}
			return true;
	}
	
	function inArray(arr, val) {
        var bIsInArray = false;

        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == val) {
                bIsInArray = true;
                break;
            }
        }

        return bIsInArray;
	}

	
    return {

    	DAYS_PURCH_HIST : 5,
    	
        contractLine : 'recmachcustrecord_wnz_con_det_contract_id',

        CONTR_HDR : {
            NAME : "name",
            TYPE:  'customrecord_wnz_contract_header',
            CONTRACT_ID : "custrecord_wnz_con_det_contract_id", // Contract ID
            CONTRACT_PARTIES : 'custrecord_wnz_hdr_contract_parties',
            START_DATE : 'custrecord_wnz_con_hdr_start_date',
            END_DATE : 'custrecord_wnz_con_hdr_end_date',
            GROSS_NETT_INDICATOR : 'custrecord_wnz_con_hdr_gross_nett', // Gross Net Indicator - List
            CONTRACT_TYPE : 'custrecord_wnz_con_hdr_type',
            SALES_PROMOTION : 'custrecord_wnz_con_hdr_sales_promo', // Sales Promotion - Checkbox
            ITEM_VOLUME_CONTRACT : 'custrecord_wnz_item_volume_contract', // Item Volume Contract - Checkbox
            CONTRACT_REFERENCE : 'custrecord_wnz_con_hdr_reference',
            CLOSE_DATE : 'custrecord_wnz_con_hdr_close_date',
            BASKET_DISC_INDICATOR : 'custrecord_wnz_bd_indicator',
            CONTRACT_STATUS : "custrecord_wnz_con_hdr_contract_sts", // Contract status - List
            DISCOUNT_TYPE : "custrecord_con_hdr_discount_type",
            CUSTOMER_REFERENCE : "custrecord_wnz_con_hdr_customer_ref",
            BAL_VOL_QUANTITY : "custrecord_qnz_con_hdr_bal_volume",
            VOLUME_UNIT_OF_MEASURE : "custrecord_wnz_con_hdr_volume_uom",
            USED_VOL_QUANTITY : "custrecord_wnz_con_hdr_used_volume",
        },

        CONTR_DETAIL : {
            TYPE : "customrecord_wnz_contract_details",
            NAME : "name",
            CONTRACT_ID : 'custrecord_wnz_con_det_contract_id',
            CONTRACT_LINE : 'custrecord_wnz_con_det_line',
            ITEM_NUMBER : 'custrecord_wnz_con_det_item_number',
            TOTAL_VOLUME_QUANTITY : 'custrecord_wnz_con_det_total_volume',
            USED_VOLUME_QUANTITY : 'custrecord_wnz_con_det_used_volume',
            BALANCE_VOLUME_QUANTITY : 'custrecord_wnz_con_det_bal_volume',
            VOLUME_UNIT_OF_MEASURE : 'custrecord_wnz_con_det_volume_uom',
            ITEM_VOLUME_CONTRACT : 'custrecord_wnz_con_itemvol_contract',
            BASKET_DISC_INDICATOR : 'custrecord_wnz_det_basket_discount_ind',
            DETAIL_STATUS : 'custrecord_wnz_con_det_status', // Contract status - List
            NEGOTIATED_CONTRACT_PRICE : 'custrecord_wnz_con_det_neg_con_price',
            CONTRACT_LINE_CREATION_DATE : 'custrecord_wnz_con_det_creation_date',
            CONTRACT_LINE_CHANGE_DATE : 'custrecord_wnz_con_det_change_date',
            CONTRACT_LINE_CLOSE_DATE : 'custrecord_wnz_con_det_close_date',
            CONTRACT_LINE_CHANGE_USER : 'custrecord_wnz_con_det_chg_user',
            CONTRACT_PARTIES : 'custrecord_wnz_contract_parties',
            START_DATE : 'custrecord_wnz_start_date',
            SALES_PROMOTION : 'custrecord_wnz_con_sales_promotion',
            GROSS_NETT_INDICATOR : 'custrecord_wnz_con_gross_net_ind',
            DISCOUNT_TYPE : 'custrecord_wnz_con_discount_type',
            END_DATE : 'custrecord_wnz_con_end_date',
            CONTRACT_TYPE : 'custrecord_con_det_type',
            CONTRACT_REFERENCE : "custrecord_wnz_con_det_reference",
            CUSTOMER_REFERENCE: "custrecord_wnz_con_det_customer_ref",
            MIN_ORDER_QTY : "custrecord_wnz_con_min_order_quantity",
            VOLUME_UOM : "custrecord_wnz_con_det_volume_uom"
        },


        GROSS_DAY_PRICE : {
            TYPE : "customrecord_wnz_purchase_day_price_list",
            ITEM : "custrecord_wnz_pur_item_gross_price",
            PRICE_DATE : "custrecord_wnz_pur_price_date",
            PRICE_GROSS : "custrecord_wnz_pur_gross_price",
            PRICE_FACTOR : "custrecord_wnz_pur_price_factor",
            DAY_PRICE_CURRENCY : "custrecord_wnz_pur_currency",
            PRICE_UOM : "custrecord_wnz_pur_price_uom",
            VENDOR : "custrecord_wnz_pur_vendor"
        },

        TRANS_BODY_FLDS : {
            PRICE_DATE : "custbody_wnz_price_date",
			HAS_CONTRACTS : "custbody_wnz_vend_has_contract",
			JSON_LINE : "custbody_wnz_json_line_item",
			FLD_IS_APPLY_REPRICE : "custbody_wnz_apply_repricing",
			EXCEED_LIMIT : "custbody_wnz_contract_exceeded_limit",
        },

        TRANS_LINE_FLDS : {
            CONTRACT_HEADER : 'custcol_wnz_contract_header',
            CONTRACT_REF_KEY : 'custcol_wnz_ocp_contract_key',
            GROSS_NETT_IND : 'custcol_wnz_ocp_gross_nett_indicator',
            ITEM_VOL_CONTRACT : 'custcol_wnz_ocp_item_volume_contract',
            SALES_PROMO : 'custcol_wnz_ocp_sales_promotion',
            TOTAL_WEIGHT_BASE : "custcol_wnz_ocp_totalweightbase",
            WEIGHT_PER_UNIT : "custcol_wnz_ocp_weightperunit",
            FLD_PREV_QUANTITY : "custcol_wnz_ocp_previous_quantity",
            ITEM_VOL_UNIT : "custcol_custcol_wnz_ocp_vol_unit",
			BASE_PRICE : "custcol_wnz_ocp_base_price",
			FLD_MAT_GRP : 'custcol_wnz_ocp_material_group',
			FLD_PROMO_DISC : 'custcol_wnz_ocp_promotion_discount',
			FLD_LINE_DISC : 'custcol_wnz_ocp_ld',
			FLD_BASKET_DISC : 'custcol_wnz_ocp_basket_discount',
    		FLD_BASKET_DISC_TYPE : 'custcol_wnz_ocp_basket_discount_type',
    		FLD_BASKET_DISC_IND : 'custcolwnz_ocp_bd_indicator',
    		FLD_PRICE_FACTOR : "custcol_wnz_price_factor_pr",
    		FLD_WENTZEL_RATE : "custcol_wnz_wentzel_rate",
    		FLD_CURNET_LD : 'custcol_wnz_ocp_curnet_ld',
    		FLD_CURNET_PD : 'custcol_wnz_ocp_curnet_pd',
    		FLD_CURNET_BT : 'custcol_wnz_ocp_curnet_3_bt',
    		FLD_LD_TYPE : 'custcol_wnz_ocp_ld_type',
    		ITEM_GRP_PRICING : 'custcol_wnz_item_group_pricing',
        },
        
        CONTRACT_STATUS : {
        	NEW : 1,
        	ACTIVE : 2,
        	COMPLETED : 3,
        },
        
        ADJUSTMENT_TYPE : {
        	PLD : '1'
        },
        
        GROSSNET : {
        	GROSS : 1,
        	NETT : 2
        },
        
        UNIT : {
        	KG : 2,
        },
        
        DISCOUNT_TYPE : {
        	PERCENT : 1,
        	FIXED_RATE : 2,
        	FIXED_RATE_EU : 3,
        },
		
		runSearch : runSearch,
		
		searchGrossDayPrice : searchGrossDayPrice, 
		
		searchGrossDayPriceHistory : searchGrossDayPriceHistory,
		
		alertSuccess : alertSuccess, 
		
		alertFailure : alertFailure,
		
		showMantle : showMantle,
		
		hideMantle : hideMantle,
		
		forceFloat : forceFloat,
		
		convNull : convNull,
		
		isEmpty : isEmpty,
		
		inArray : inArray
		
    }

});
