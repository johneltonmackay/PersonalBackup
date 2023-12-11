/**
 * @NApiVersion 2.1
 *
 */

define(["N/search", "N/record", "./anwb-xmltojson", "N/format"], (
  search,
  record,
  _xmltojson,
  format
) => {
  const serverSearch = "1568";
  const RecordType = "customrecord_anwb_lev_catalogus";
  const RecordTypeFields = {
    ARTICLE_CODE: {
      name: "custrecord_lev_cat_artikelcode",
    },
    EAN_CODE: {
      name: "custrecord_lev_cat_eancode",
    },
    ARTICLEOMSSCHRIJVING: {
      name: "custrecord_lev_cat_artikelomschrijving",
    },
    INKOOPPRIJS: {
      name: "custrecord_lev_cat_inkoopprijs",
    },
    VERKOOPPRIJS: {
      name: "custrecord_lev_cat_verkoopprijs",
    },
    LEVERENCIER: {
      name: "custrecord_lev_cat_leverancier",
    },
    ARTIKEL_AANGEMAAKT: {
      name: "custrecord_lev_cat_artikel_aangemaakt",
    },
    LINK_TO_ITEM: {
      name: "custrecord_anwb_linktoitem",
    },
    CATALOG_JSON: {
      name: "custrecord_anwb_catalogjson",
    },
    VENDOR_CATEGORY: {
      name: "custrecord_anwb_vendor_category_supcat",
    },
  };

  const TIRECATEGORY = '201';

  const getSearch = (ssId) => {
    log.debug("getSearch", ssId);
    let toReturn = [];

    const searchObj = search.load({
      id: "customsearch_anw_update_prices_lev_cat",
    });

    let pagedData = searchObj.runPaged({ pageSize: 1000 });
    // iterate the pages
    for (var i = 0; i < pagedData.pageRanges.length; i++) {
      log.debug("getSearchLoop", "hit");
      // fetch the current page data
      var currentPage = pagedData.fetch(i);
      currentPage.data.forEach(function (result) {
        log.debug("getSearchLoop", "currentPage loop");
        toReturn.push({
          id: result.id,
          article_code: result.getValue(RecordTypeFields.ARTICLE_CODE),
          ean_code: result.getValue(RecordTypeFields.EAN_CODE),
          article_omcsschrijving: result.getValue(
            RecordTypeFields.ARTICLEOMSSCHRIJVING
          ),
          inkoopprijs: result.getValue(RecordTypeFields.INKOOPPRIJS),
          verkoopprijs: result.getValue(RecordTypeFields.VERKOOPPRIJS),
          leverencier: result.getValue(RecordTypeFields.LEVERENCIER),
          leverencierText: result.getText(RecordTypeFields.LEVERENCIER),
          article_aangemaakt: result.getValue(
            RecordTypeFields.ARTIKEL_AANGEMAAKT
          ),
          link_to_item: result.getValue(RecordTypeFields.LINK_TO_ITEM),
          link_to_item_text: result.getText(RecordTypeFields.LINK_TO_ITEM),
          catalog_json: result.getValue(RecordTypeFields.CATALOG_JSON),
        });
      });
    }

    log.debug("Data", toReturn);
    return toReturn;
  };

  const filterData = (params) => {
    let toReturn = [];
    let filters = [["isinactive", "is", "F"]];
    if (params.filters.articleCode != "") {
      filters.push("AND");
      filters.push([
        "custrecord_lev_cat_artikelcode",
        "contains",
        params.filters.articleCode,
      ]);
    }
    if (params.filters.eanCode != "") {
      filters.push("AND");
      filters.push([
        "custrecord_lev_cat_eancode",
        "contains",
        params.filters.eanCode,
      ]);
    }
    if (params.filters.art != "") {
      filters.push("AND");
      filters.push([
        "custrecord_lev_cat_artikelomschrijving",
        "contains",
        params.filters.art,
      ]);
    }
    log.debug("filters", filters);
    var searchObj = search.create({
      type: RecordType,
      filters: filters,
      columns: [
        search.createColumn(RecordTypeFields.ARTICLE_CODE),
        search.createColumn(RecordTypeFields.EAN_CODE),
        search.createColumn(RecordTypeFields.ARTICLEOMSSCHRIJVING),
        search.createColumn(RecordTypeFields.INKOOPPRIJS),
        search.createColumn(RecordTypeFields.VERKOOPPRIJS),
        search.createColumn(RecordTypeFields.LEVERENCIER),
        search.createColumn(RecordTypeFields.ARTIKEL_AANGEMAAKT),
        search.createColumn(RecordTypeFields.LINK_TO_ITEM),
        search.createColumn(RecordTypeFields.VENDOR_CATEGORY),
      ],
    });
    let pagedData = searchObj.runPaged({ pageSize: 1000 });
    // iterate the pages
    for (var i = 0; i < pagedData.pageRanges.length; i++) {
      // fetch the current page data
      var currentPage = pagedData.fetch(i);
      currentPage.data.forEach(function (result) {
        toReturn.push({
          id: result.id,
          article_code: result.getValue(RecordTypeFields.ARTICLE_CODE),
          ean_code: result.getValue(RecordTypeFields.EAN_CODE),
          article_omcsschrijving: result.getValue(
            RecordTypeFields.ARTICLEOMSSCHRIJVING
          ),
          inkoopprijs: result.getValue(RecordTypeFields.INKOOPPRIJS),
          verkoopprijs: result.getValue(RecordTypeFields.VERKOOPPRIJS),
          leverencier: result.getValue(RecordTypeFields.LEVERENCIER),
          leverencierText: result.getText(RecordTypeFields.LEVERENCIER),
          article_aangemaakt: result.getValue(
            RecordTypeFields.ARTIKEL_AANGEMAAKT
          ),
          link_to_item: result.getValue(RecordTypeFields.LINK_TO_ITEM),
          link_to_item_text: result.getText(RecordTypeFields.LINK_TO_ITEM),
          vendor_category: result.getValue(RecordTypeFields.VENDOR_CATEGORY),
        });
      });
    }
    log.debug("Data", toReturn);
    return toReturn;
  };

  const createItem = (params) => {
    //add mapping to custom record field
    const categories = [];
    let categoryData = [];
    params.toCreate.forEach((item) => {
      categories.push(item.vendor_category);
    });
    log.debug("items", categories);
    if (categories.length > 0) {
      const searchCategory = search.create({
        type: "customrecord_anwb_categorymatching",
        filters: [["custrecord_anwb_vendor_category", "anyof", categories]],
        columns: [
          "custrecord_anwb_vendor_category",
          "custrecord_anwb_category_1",
          "custrecord_anwb_category_2",
          "custrecord_anwb_category_3",
        ],
      });
      var searchResultCount = searchCategory.runPaged().count;
      log.debug("searchCategory result count", searchResultCount);
      searchCategory.run().each(function (result) {
        const vendorcat = result.getValue({
          name: "custrecord_anwb_vendor_category",
        });
        const categoryIndex = categoryData.findIndex(
          (res) => res.vendorCat == vendorcat
        );
        if (categoryIndex == -1) {
          categoryData.push({
            vendor_category: vendorcat,
            categoryOne: result.getValue({
              name: "custrecord_anwb_category_1",
            }),
            categoryTwo: result.getValue({
              name: "custrecord_anwb_category_2",
            }),
            categoryThree: result.getValue({
              name: "custrecord_anwb_category_3",
            }),
          });
        }
        return true;
      });
    }

    log.debug("categoryData", categoryData);
    let toReturn = [];
    params.toCreate.forEach((item) => {
      const modifiedItem = createNetsuiteItem(
        item,
        params.vendor,
        categoryData
      );
      toReturn.push(modifiedItem);
    });
    //update the
    params.toAdd.forEach((item) => {
      item = updateItem(item, params.vendor);
      toReturn.push(item);
    });
    log.debug('toReturn', toReturn);
    return toReturn;
  };

  const createNetsuiteItem = (item, paramVendor, categoryData) => {
    log.debug("Creating Item", item);
    const itemObj = record.create({
      type: "inventoryitem",
      isDynamic: true,
    });
    itemObj.setValue({
      fieldId: "itemid",
      value: item.article_code,
    });
    itemObj.setValue({
      fieldId: "upccode",
      value: item.ean_code,
    });
    itemObj.setValue({
      fieldId: "subsidiary",
      value: "1",
    });
    itemObj.setValue({
      fieldId: "taxschedule",
      value: "1",
    });
    itemObj.setValue({
      fieldId: "usebins",
      value: true,
    });
    itemObj.setValue({
      fieldId: "unitstype",
      value: 1,
    });
    itemObj.setValue({
      fieldId: "displayname",
      value: item.article_omcsschrijving,
    });
    itemObj.setValue({
      fieldId: "purchasedescription",
      value: item.article_omcsschrijving,
    });
    itemObj.setValue({
      fieldId: "salesdescription",
      value: item.article_omcsschrijving,
    });

    itemObj.setValue({
      fieldId: "custitem_anwb_incidenteel_artikel",
      value: true,
    });
    itemObj.setValue({
      fieldId: "department",
      value: 11,
    });

    //sets the categories
    const currentCategory = categoryData.filter(
      (cat) => cat.vendor_category == item.vendor_category
    );
    log.debug("current category", currentCategory);
    if (currentCategory.length > 0) {
      itemObj.setValue({
        fieldId: "custitem_anwb_vendor_cat",
        value: currentCategory[0].vendor_category,
      });
      itemObj.setValue({
        fieldId: "custitem_anwb_category_1",
        value: currentCategory[0].categoryOne,
      });
      itemObj.setValue({
        fieldId: "custitem_anwb_category_2",
        value: currentCategory[0].categoryTwo,
      });
      itemObj.setValue({
        fieldId: "custitem_anwb_category_3",
        value: currentCategory[0].categoryThree,
      });
    }

    itemObj.selectLine({ sublistId: "price1", line: 0 });
    // saved search on customrecord_anwb_markups with vendor_category = itemObj.getValue("custitem_anwb_vendor_cat") fetch both custrecord_anwb_disposal_fee and custrecord_anwb_markup_sales
    var markupSearch = search.create({
      type: "customrecord_anwb_markups",
      filters: [
        ["custrecord_anwb_vendor_cat", "anyof", itemObj.getValue("custitem_anwb_vendor_cat")],
        "AND",
        ["isinactive", "is", "F"],
      ],
      columns: [
        search.createColumn({
          name: "custrecord_anwb_disposal_fee",
          sort: search.Sort.ASC,
          label: "Disposal Fee",
        }),
        search.createColumn({
          name: "custrecord_anwb_markup_sales",
          sort: search.Sort.ASC,
          label: "Markup Sales",
        }),
      ],
    });
    var searchResultCount = markupSearch.runPaged().count;
    log.debug("markupSearch result count", searchResultCount);
    let disposalFee = 0;
    let markupSales = 0;
    markupSearch.run().each(function (result) {
      disposalFee = result.getValue({
        name: "custrecord_anwb_disposal_fee",
      });
      markupSales = result.getValue({
        name: "custrecord_anwb_markup_sales",
      });
      return true; // return true to keep iterating
    });
    if (!item.inkoopprijs) {
      item.inkoopprijs = 0;
    }
    var origineleInkoopprijs = item.inkoopprijs;
    
    if (disposalFee != 0 || markupSales != 0) {
      log.debug("disposalFee", disposalFee);
      log.debug("markupSales", markupSales);
      if (item.inkoopprijs) {
        log.debug("item.inkoopprijs", item.inkoopprijs);
        item.inkoopprijs = format.parse({value:item.inkoopprijs, type: format.Type.FLOAT})
        if (disposalFee != 0) {
          disposalFee = format.parse({value:disposalFee, type: format.Type.FLOAT})
          item.inkoopprijs = item.inkoopprijs + disposalFee;
        }
        if (markupSales != 0) {
          markupSales = format.parse({value:markupSales, type: format.Type.FLOAT})
          item.verkoopprijs = item.inkoopprijs + markupSales;
        }
        // item.verkoopprijs = Number(item.inkoopprijs) + 36.70;
      } else {
        item.verkoopprijs = 0;
      }
    }
    
    log.debug("item.inkoopprijs", item.inkoopprijs);
    log.debug("item.verkoopprijs", item.verkoopprijs);
    
    itemObj.setValue({
      fieldId: "cost",
      value: item.inkoopprijs,
    });
    itemObj.setCurrentMatrixSublistValue({
      sublistId: "price1",
      fieldId: "price",
      column: 0,
      value: item.verkoopprijs,
    });
    itemObj.commitLine({ sublistId: "price1" });

    itemObj.selectNewLine({ sublistId: "itemvendor" });
    itemObj.setCurrentSublistValue({
      sublistId: "itemvendor",
      fieldId: "vendor",
      value: paramVendor,
    });
    itemObj.setCurrentSublistValue({
      sublistId: "itemvendor",
      fieldId: "purchaseprice",
      value: item.inkoopprijs,
    });
    itemObj.setCurrentSublistValue({
      sublistId: "itemvendor",
      fieldId: "preferredvendor",
      value: true,
    });
    itemObj.commitLine({ sublistId: "itemvendor" });

    const id = itemObj.save(true, true);
    if (id) {
      record.submitFields({
        type: RecordType,
        id: item.id,
        values: {
          custrecord_anwb_linktoitem: id,
          custrecord_lev_cat_artikel_aangemaakt: true,
          custrecord_lev_cat_inkoopprijs: origineleInkoopprijs,
        },
      });
      item.link_to_item = id;
      item.article_aangemaakt = true;
    }
    return item;
  };

  const updateItem = (item, paramVendor) => {
    log.debug("Updating Item", item);
    const itemObj = record.load({
      type: "inventoryitem",
      id: item.link_to_item,
      isDynamic: true,
    });
    if (!item.inkoopprijs) {
      item.inkoopprijs = 0;
    }
    var origineleInkoopprijs = item.inkoopprijs;
    // log itemObj.getValue("custitem_anwb_vendor_cat"
    log.debug("vendor category", itemObj.getValue("custitem_anwb_vendor_cat"));
    // saved search on customrecord_anwb_markups with vendor_category = itemObj.getValue("custitem_anwb_vendor_cat") fetch both custrecord_anwb_disposal_fee and custrecord_anwb_markup_sales
    var markupSearch = search.create({
      type: "customrecord_anwb_markups",
      filters: [
        ["custrecord_anwb_vendor_cat", "anyof", itemObj.getValue("custitem_anwb_vendor_cat")],
        "AND",
        ["isinactive", "is", "F"],
      ],
      columns: [
        search.createColumn({
          name: "custrecord_anwb_disposal_fee",
          sort: search.Sort.ASC,
          label: "Disposal Fee",
        }),
        search.createColumn({
          name: "custrecord_anwb_markup_sales",
          sort: search.Sort.ASC,
          label: "Markup Sales",
        }),
      ],
    });
    var searchResultCount = markupSearch.runPaged().count;
    log.debug("markupSearch result count", searchResultCount);
    let disposalFee = 0;
    let markupSales = 0;
    markupSearch.run().each(function (result) {
      // log result.getValue({ name: 'custrecord_anwb_disposal_fee' });
      log.debug("disposalFee", result.getValue({ name: "custrecord_anwb_disposal_fee" }));
      disposalFee = result.getValue({
        name: "custrecord_anwb_disposal_fee",
      });
      // log result.getValue({ name: 'custrecord_anwb_markup_sales' });
      log.debug("markupSales", result.getValue({ name: "custrecord_anwb_markup_sales" }));
      markupSales = result.getValue({
        name: "custrecord_anwb_markup_sales",
      });
      return true; // return true to keep iterating
    });
    // log disposalFee
    log.debug("disposalFee", disposalFee);
    // log markupSales
    log.debug("markupSales", markupSales);
    if (disposalFee != 0 || markupSales != 0) {
      log.debug("disposalFee", disposalFee);
      log.debug("markupSales", markupSales);
      if (item.inkoopprijs) {
        log.debug("item.inkoopprijs", item.inkoopprijs);
        item.inkoopprijs = format.parse({value:item.inkoopprijs, type: format.Type.FLOAT})
        if (disposalFee != 0) {
          disposalFee = format.parse({value:disposalFee, type: format.Type.FLOAT})
          item.inkoopprijs = item.inkoopprijs + disposalFee;
        }
        if (markupSales != 0) {
          markupSales = format.parse({value:markupSales, type: format.Type.FLOAT})
          item.verkoopprijs = item.inkoopprijs + markupSales;
        }
        // item.verkoopprijs = Number(item.inkoopprijs) + 36.70;
      } else {
        item.verkoopprijs = 0;
      }
    }
    itemObj.setValue({
      fieldId: "cost",
      value: item.inkoopprijs,
    });
    itemObj.selectLine({ sublistId: "price1", line: 0 });
    itemObj.setCurrentMatrixSublistValue({
      sublistId: "price1",
      fieldId: "price",
      column: 0,
      value: item.verkoopprijs,
    });
    itemObj.commitLine({ sublistId: "price1" });

    for (
      var x = 0;
      x < itemObj.getLineCount({ sublistId: "itemvendor" });
      x++
    ) {
      itemObj.selectLine({
        sublistId: "itemvendor",
        line: x,
      });
      const vendor = itemObj.getCurrentSublistValue({
        sublistId: "itemvendor",
        fieldId: "vendor",
        line: x,
      });
      /* log.debug("sublist vendor", vendor);
      log.debug("param vendor", paramVendor);
      log.debug("Notice", vendor == paramVendor); */
      if (vendor == paramVendor) {
        const sublistRecord = itemObj.getCurrentSublistSubrecord({
          sublistId: "itemvendor",
          fieldId: "itemvendorprice",
        });

        var count = sublistRecord.getLineCount({
          sublistId: "itemvendorpricelines",
        });
        for (var i = 0; i < count; i++) {
          sublistRecord.selectLine({
            sublistId: "itemvendorpricelines",
            line: i,
          });
          sublistRecord.setCurrentSublistValue({
            sublistId: "itemvendorpricelines",
            fieldId: "vendorprice",
            value: item.inkoopprijs,
          });
          sublistRecord.commitLine({ sublistId: "itemvendorpricelines" });
        }
      }
      itemObj.commitLine({ sublistId: "itemvendor" });
    }
    itemObj.save();
    record.submitFields({
      type: RecordType,
      id: item.id,
      values: {
        custrecord_lev_cat_inkoopprijs: origineleInkoopprijs,
      },
    });
    return item
  };

  return { RecordTypeFields, getSearch, filterData, serverSearch, createItem };
});
