<<<<<<< HEAD
/**
 * @NApiVersion 2.1
 */
define([], () => {

    const BASE_MENU = {
        ARR_TYPE1_FIELDID: [
            {
                BASEMENU1_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_bt1_o1',
                    FLORAL_PRICE: 'custbody_price_with_floral_bnqt_type1'
                }
            },
            {
                BASEMENU2_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_bt1_o2',
                    FLORAL_PRICE: 'custbody_price_with_floral_bnqt_t1_o2'
                }
            },
            {
                BASEMENU3_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_bt1_o3',
                    FLORAL_PRICE: 'custbody_price_with_floral_bnqt_t1_o3'
                }
            }
        ],

        ARR_TYPE2_FIELDID: [
            {
                BASEMENU1_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_bt2_o1',
                    FLORAL_PRICE: 'custbody_netpricewithfloral_type2'
                }
            },
            {
                BASEMENU2_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_bt2_o2',
                    FLORAL_PRICE: 'custbody_netpricewithfloral_base_b2_o2'
                }
            },
            {
                BASEMENU3_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_bt2_o3',
                    FLORAL_PRICE: 'custbody_netpricewithfloral_base_b2_o3'
                }
            }
        ],

        ARR_TYPE3_FIELDID: [
            {
                BASEMENU1_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_proposed_price_bt3_o1_base',
                    FLORAL_PRICE: 'custbody_netprice_with_floral_bt3'
                }
            },
            {
                BASEMENU2_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_proposed_price_bt3_o2_base',
                    FLORAL_PRICE: 'custbody_netprice_with_floral_bt3_o2'
                }
            },
            {
                BASEMENU3_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_proposed_price_bt3_o3_base',
                    FLORAL_PRICE: 'custbody_netprice_with_floral_bt3_o3'
                }
            }
        ]
    };

    const ADDON = {
        ARR_TYPE1_FIELDID: [
            {
                ADDON1_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_addon_bt1_o1',
                    NET_PRICE: 'custbody_netprice_bnqt_fnb_addon'
                }
            },
            {
                ADDON2_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_addon_bt1_o2',
                    NET_PRICE: 'custbody_netprice_bqt_fnb_addon_bt1_o2'
                }
            },
            {
                ADDON3_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_addon_bt1_o3',
                    NET_PRICE: 'custbody_netprice_bqt_fnb_addon_bt1_o3'
                }
            }
        ],
        ARR_TYPE2_FIELDID: [
            {
                ADDON_MANPOWER1_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_mp_bt2_o1',
                    NET_PRICE: 'custbody_netprice_stationwithmanpower2'
                }
            },
            {
                ADDON_MANPOWER2_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_mp_bt2_o2',
                    NET_PRICE: 'custbody_netprice_station_mp_b2_o2'
                }
            },
            {
                ADDON_MANPOWER3_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_mp_bt2_o3',
                    NET_PRICE: 'custbody_netprice_station_mp_b2_o3'
                }
            },
            {
                ADDON_WITHOUT_MAN1_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_wo_mp_bt2_o1',
                    NET_PRICE: 'custbody_netprice_station_wo_manpower2'
                }
            },
            {
                ADDON_WITHOUT_MAN2_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_wo_mp_bt2_o2',
                    NET_PRICE: 'custbody_netprice_station_wo_mp_b2_o2'
                }
            },
            {
                ADDON_WITHOUT_MAN3_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_wo_mp_bt2_o3',
                    NET_PRICE: 'custbody_netprice_station_wo_mp_b2_o3'
                }
            }
        ],
        ARR_TYPE3_FIELDID: [
            {
                ADDON_MANPOWER1_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_proposed_price_bt3_o1_wmp',
                    NET_PRICE: 'custbody_netprice42_bnqtstatman3'
                }
            },
            {
                ADDON_MANPOWER2_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_proposed_price_bt3_o2_wmp',
                    NET_PRICE: 'custbody_netprice42_w_mp_bt3_o2'
                }
            },
            {
                ADDON_MANPOWER3_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_proposed_price_bt3_o3_wmp',
                    NET_PRICE: 'custbody_netprice42_w_mp_bt3_o3'
                }
            },
            {
                ADDON_WITHOUT_MAN1_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_proposed_price_bt3_o1_womp',
                    NET_PRICE: 'custbody_netpricebbevstatwomanpower3'
                }
            },
            {
                ADDON_WITHOUT_MAN2_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_proposed_price_bt3_o2_womp',
                    NET_PRICE: 'custbody_netprice_wo_mp_bt3_o2'
                }
            },
            {
                ADDON_WITHOUT_MAN3_ID: {
                    PROPOSED_PRICE: 'custbody_proposed_price_bt3_o3_womp',
                    NET_PRICE: 'custbody_netprice_wo_mp_bt3_o3'
                }
            }
        ],
    }

    // Placeholder arrays for proposed and net prices

    // Initialize BASE_MENU_FIELDS object with empty arrays
    let BASE_MENU_FIELDS = {
        FLORAL_PRICE: [],
        PROPOSED_PRICE: []
    };

    // Initialize ADD_ON_FIELDS object with empty arrays
    let ADD_ON_FIELDS = {
        NET_PRICE: [],
        PROPOSED_PRICE: []
    };

    // Iterate through BASE_MENU
    Object.values(BASE_MENU).forEach(menu => {
        menu.forEach(item => {
            Object.values(item).forEach(val => {
                // Push values into respective arrays inside BASE_MENU_FIELDS
                BASE_MENU_FIELDS.FLORAL_PRICE.push(val.FLORAL_PRICE);
                BASE_MENU_FIELDS.PROPOSED_PRICE.push(val.PROPOSED_PRICE);
            });
        });
    });


    // Iterate over ADDON to extract proposed and net prices
    Object.values(ADDON).forEach(addon => {
        addon.forEach(item => {
            Object.values(item).forEach(val => {
                // Push values into respective arrays inside ADD_ON_FIELDS
                ADD_ON_FIELDS.NET_PRICE.push(val.NET_PRICE);
                ADD_ON_FIELDS.PROPOSED_PRICE.push(val.PROPOSED_PRICE);
            });
        });
    });

    return { BASE_MENU, ADDON, BASE_MENU_FIELDS, ADD_ON_FIELDS};

});
=======
/**
 * @NApiVersion 2.1
 */
define([], () => {

    const BASE_MENU = {
        ARR_TYPE1_FIELDID: [
            {
                BASEMENU1_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_bt1_o1',
                    FLORAL_PRICE: 'custbody_price_with_floral_bnqt_type1'
                }
            },
            {
                BASEMENU2_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_bt1_o2',
                    FLORAL_PRICE: 'custbody_price_with_floral_bnqt_t1_o2'
                }
            },
            {
                BASEMENU3_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_bt1_o3',
                    FLORAL_PRICE: 'custbody_price_with_floral_bnqt_t1_o3'
                }
            }
        ],

        ARR_TYPE2_FIELDID: [
            {
                BASEMENU1_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_bt2_o1',
                    FLORAL_PRICE: 'custbody_netpricewithfloral_type2'
                }
            },
            {
                BASEMENU2_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_bt2_o2',
                    FLORAL_PRICE: 'custbody_netpricewithfloral_base_b2_o2'
                }
            },
            {
                BASEMENU3_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_bt2_o3',
                    FLORAL_PRICE: 'custbody_netpricewithfloral_base_b2_o3'
                }
            }
        ],

        ARR_TYPE3_FIELDID: [
            {
                BASEMENU1_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_proposed_price_bt3_o1_base',
                    FLORAL_PRICE: 'custbody_netprice_with_floral_bt3'
                }
            },
            {
                BASEMENU2_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_proposed_price_bt3_o2_base',
                    FLORAL_PRICE: 'custbody_netprice_with_floral_bt3_o2'
                }
            },
            {
                BASEMENU3_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_proposed_price_bt3_o3_base',
                    FLORAL_PRICE: 'custbody_netprice_with_floral_bt3_o3'
                }
            }
        ]
    };

    const ADDON = {
        ARR_TYPE1_FIELDID: [
            {
                ADDON1_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_addon_bt1_o1',
                    NET_PRICE: 'custbody_netprice_bnqt_fnb_addon'
                }
            },
            {
                ADDON2_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_addon_bt1_o2',
                    NET_PRICE: 'custbody_netprice_bqt_fnb_addon_bt1_o2'
                }
            },
            {
                ADDON3_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_addon_bt1_o3',
                    NET_PRICE: 'custbody_netprice_bqt_fnb_addon_bt1_o3'
                }
            }
        ],
        ARR_TYPE2_FIELDID: [
            {
                ADDON_MANPOWER1_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_mp_bt2_o1',
                    NET_PRICE: 'custbody_netprice_stationwithmanpower2'
                }
            },
            {
                ADDON_MANPOWER2_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_mp_bt2_o2',
                    NET_PRICE: 'custbody_netprice_station_mp_b2_o2'
                }
            },
            {
                ADDON_MANPOWER3_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_mp_bt2_o3',
                    NET_PRICE: 'custbody_netprice_station_mp_b2_o3'
                }
            },
            {
                ADDON_WITHOUT_MAN1_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_wo_mp_bt2_o1',
                    NET_PRICE: 'custbody_netprice_station_wo_manpower2'
                }
            },
            {
                ADDON_WITHOUT_MAN2_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_wo_mp_bt2_o2',
                    NET_PRICE: 'custbody_netprice_station_wo_mp_b2_o2'
                }
            },
            {
                ADDON_WITHOUT_MAN3_ID: {
                    PROPOSED_PRICE: 'custbody_final_price_wo_mp_bt2_o3',
                    NET_PRICE: 'custbody_netprice_station_wo_mp_b2_o3'
                }
            }
        ],
        ARR_TYPE3_FIELDID: [
            {
                ADDON_MANPOWER1_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_proposed_price_bt3_o1_wmp',
                    NET_PRICE: 'custbody_netprice42_bnqtstatman3'
                }
            },
            {
                ADDON_MANPOWER2_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_proposed_price_bt3_o2_wmp',
                    NET_PRICE: 'custbody_netprice42_w_mp_bt3_o2'
                }
            },
            {
                ADDON_MANPOWER3_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_proposed_price_bt3_o3_wmp',
                    NET_PRICE: 'custbody_netprice42_w_mp_bt3_o3'
                }
            },
            {
                ADDON_WITHOUT_MAN1_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_proposed_price_bt3_o1_womp',
                    NET_PRICE: 'custbody_netpricebbevstatwomanpower3'
                }
            },
            {
                ADDON_WITHOUT_MAN2_FIELD_ID: {
                    PROPOSED_PRICE: 'custbody_proposed_price_bt3_o2_womp',
                    NET_PRICE: 'custbody_netprice_wo_mp_bt3_o2'
                }
            },
            {
                ADDON_WITHOUT_MAN3_ID: {
                    PROPOSED_PRICE: 'custbody_proposed_price_bt3_o3_womp',
                    NET_PRICE: 'custbody_netprice_wo_mp_bt3_o3'
                }
            }
        ],
    }

    // Placeholder arrays for proposed and net prices

    // Initialize BASE_MENU_FIELDS object with empty arrays
    let BASE_MENU_FIELDS = {
        FLORAL_PRICE: [],
        PROPOSED_PRICE: []
    };

    // Initialize ADD_ON_FIELDS object with empty arrays
    let ADD_ON_FIELDS = {
        NET_PRICE: [],
        PROPOSED_PRICE: []
    };

    // Iterate through BASE_MENU
    Object.values(BASE_MENU).forEach(menu => {
        menu.forEach(item => {
            Object.values(item).forEach(val => {
                // Push values into respective arrays inside BASE_MENU_FIELDS
                BASE_MENU_FIELDS.FLORAL_PRICE.push(val.FLORAL_PRICE);
                BASE_MENU_FIELDS.PROPOSED_PRICE.push(val.PROPOSED_PRICE);
            });
        });
    });


    // Iterate over ADDON to extract proposed and net prices
    Object.values(ADDON).forEach(addon => {
        addon.forEach(item => {
            Object.values(item).forEach(val => {
                // Push values into respective arrays inside ADD_ON_FIELDS
                ADD_ON_FIELDS.NET_PRICE.push(val.NET_PRICE);
                ADD_ON_FIELDS.PROPOSED_PRICE.push(val.PROPOSED_PRICE);
            });
        });
    });

    return { BASE_MENU, ADDON, BASE_MENU_FIELDS, ADD_ON_FIELDS};

});
>>>>>>> 30cd781033a7dd53058a31b8bf2f43b9971eef48
