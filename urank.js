
var Urank = (function(){

    var _this, s = {},
        contentList, tagCloud, tagBox, visCanvas, docViewer;
    // Color scales
    var tagColorRange = colorbrewer.Blues[TAG_CATEGORIES + 1].slice(1, TAG_CATEGORIES+1);
  //  tagColorRange.splice(tagColorRange.indexOf("#08519c"), 1, "#2171b5");
    var queryTermColorRange = colorbrewer.Set2[8];
    queryTermColorRange.splice(queryTermColorRange.indexOf("#ffff33"), 1, "#ffd700");

    //   defaults
    var defaultInitOptions = {
        root: 'body',
        tagCloudRoot: '',
        tagBoxRoot: '',
        contentListRoot: '',
        visCanvasRoot: '',
        docViewerRoot: '',
        onLoad: function(keywords){},
        onChange: function(rankingData, selecedKeywords){},
        onItemClicked: function(documentId){},
        onItemMouseEnter: function(documentId){},
        onItemMouseLeave: function(documentId){},
        onFaviconClicked: function(documentId){},
        onWatchiconClicked: function(documentId){},
        onTagInCloudMouseEnter: function(index){},
        onTagInCloudMouseLeave: function(index){},
        onTagInCloudClick: function(index){},
        onDocumentHintClick: function(index){},
        onKeywordHintMouseEnter: function(index){},
        onKeywordHintMouseLeave: function(index){},
        onKeywordHintClick: function(index){},
        onTagDeleted: function(index){},
        onTagDropped: function(index, queryTermColor){},
        onTagInBoxMouseEnter: function(index){},
        onTagInBoxMouseLeave: function(index){},
        onTagInBoxClick: function(index){},
        onReset: function(){},
        onRankByOverallScore: function(){},
        onRankByMaximumScore: function(){}
    };

    var defaultLoadOptions = {
        tagCloud : {
            module: 'default',      // default || landscape
            misc: {
                defaultBlockStyle: true,
                customScrollBars: true
            }
        },
        contentList: {
            custom: false,
            customOptions: {     //  only used when contentListType.custom = true
                selectors: {
                    root: '',
                    ul: '',
                    liClass: '',
                    liTitle: '',
                    liRankingContainer: '',  // will be formatted
                    watchicon: '',           // adds watchicon in placeholder
                    favicon: ''              // adds favicon in placeholder
                },
                classes: {
                    liHoverClass: '',
                    liLightBackgroundClass: '',
                    liDarkBackgroundClass: ''
                },
                misc: {
                    hideScrollbar: false
                }
            },
        },
        visCanvas : {
            module: 'ranking',
            customOptions: {               // use only if contentList.custom = true and background in the ranking should match different light and dark background colors
                lightBackgroundColor: '',
                darkBackgroundColor: ''
            },
            misc: {
                hideScrollbar: true
            }
        },
        tagBox: {
            misc: {
                defaultBlockStyle: true
            }
        },
        docViewer: {
            misc: {
                defaultBlockStyle: true,
                customScrollBars: true,
                facetsToShow: []
            }
        },
        misc: {
            tagColorArray: tagColorRange,
            queryTermColorArray: queryTermColorRange,
        }
    };


var enterLog = function(value){
    var scriptURL = '../server/log.php',
        date = new Date(),
        timestamp = date.getFullYear() + '-' + (parseInt(date.getMonth()) + 1) + '-' + date.getDate() + '_' + date.getHours() + '.' + date.getMinutes() + '.' + date.getSeconds(),
        urankState = timestamp+' '+value,
        gf = [{ filename: 'urank_labeled_' + timestamp + '.txt', content: urankState }];//JSON.stringify(urankState)

    $.generateFile({ filename: "bookmarks.json", content: urankState, script: scriptURL });

    return false;
}


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    var EVTHANDLER = {

        onLoad: function(data, options) {
            //console.log(data)
            _this.clear();
            var o = $.extend(true, defaultLoadOptions, options || {});

            //  Set color scales (need to be reset every time a new dataset is loaded)
            o.tagColorArray = o.misc.tagColorArray.length >= TAG_CATEGORIES ? o.misc.tagColorArray : tagColorRange;
            o.queryTermColorArray = o.misc.queryTermColorArray.length >= TAG_CATEGORIES ? o.misc.queryTermColorArray : queryTermColorRange;
            _this.tagColorScale = null;
            _this.tagColorScale = d3.scale.ordinal().domain(d3.range(0, TAG_CATEGORIES, 1)).range(o.tagColorArray);
            _this.queryTermColorScale = null;
            _this.queryTermColorScale = d3.scale.ordinal().range(o.queryTermColorArray);

            //  Initialize keyword extractor
            var keywordExtractorOptions = { minRepetitions: (parseInt(data.length * 0.05) >= 5) ? parseInt(data.length * 0.05) : 5 };
            var keywordExtractor = new KeywordExtractor(keywordExtractorOptions);

            //  Clean documents and add them to the keyword extractor
            _this.data = typeof data == 'string' ? JSON.parse(data) : data.slice();

            _this.data.forEach(function(d, i){
                d.index = i;
                //d.title = d.title.clean();
                d.description = d.description.clean();
                /**
                 * Modified by Jorch
                 * Only using the connections words to build the tags block
                 * @type {string}
                 */
                //var document = (d.description) ? d.title +'. '+ d.description : d.title; //original version
                var document = (d.description) ? d.description : "";

                /**
                 * Modified by Jorch
                 */
                //keywordExtractor.addDocument(document.removeUnnecessaryChars(), d.id); //original version
                keywordExtractor.addDocument(document, d.id);
            });

            //  Extract collection and document keywords
            keywordExtractor.processCollection();

            //  Assign document keywords
            _this.data.forEach(function(d, i){
                d.keywords = keywordExtractor.listDocumentKeywords(i);
            });

            //  Assign collection keywords and set other necessary variables
            _this.keywords = keywordExtractor.getCollectionKeywords();
            _this.keywordsDict = keywordExtractor.getCollectionKeywordsDictionary();
            _this.rankingMode = RANKING_MODE.overall_score;
            _this.rankingModel.clear().setData(_this.data);
            _this.selectedKeywords = [];
            _this.selectedId = STR_UNDEFINED;

            //  Build blocks
/*            var buildOpt = {
                contentList: o.contentList,
                tagCloud:    o.tagCloud, { customScrollBars: o.misc.customScrollBars }),
                tagBox:      $.extend(o.tagBox, { customScrollBars: o.misc.customScrollBars }),
                visCanvas:   $.extend(o.visCanvas, { customScrollBars: o.misc.customScrollBars }),
                docViewer:   $.extend(o.docViewer, { customScrollBars: o.misc.customScrollBars })
            };*/
            contentList.build(_this.data, o.contentList);
            tagCloud.build(_this.keywords, _this.data, _this.tagColorScale, o.tagCloud, _this.keywordsDict);
            tagBox.build(o.tagBox);
            visCanvas.build(contentList.getListHeight(), o.visCanvas);
            docViewer.build(o.docViewer);

            //  Bind event handlers to resize window and undo effects on random click
            $(window).off('resize', EVTHANDLER.onResize).resize(EVTHANDLER.onResize);
            $(s.root)
            .off({
                'mousedown': EVTHANDLER.onRootMouseDown,
                'click': EVTHANDLER.onRootClick
            }).on({
                'mousedown': EVTHANDLER.onRootMouseDown,
                'click': EVTHANDLER.onRootClick
            });

            //  Custom callback
            s.onLoad.call(this, _this.keywords);

        },

        onChange: function(selectedKeywords) {

            /**
             * Modified by Jorch
             * @type {*}
             */
            docViewer.updateSelectedKeys(selectedKeywords);

            _this.selectedKeywords = selectedKeywords;
            _this.selectedId = STR_UNDEFINED;

            var rankingData = _this.rankingModel.update(_this.selectedKeywords, _this.rankingMode).getRanking();
            var status = _this.rankingModel.getStatus();
            contentList.update(rankingData, status, _this.selectedKeywords, _this.queryTermColorScale);
            visCanvas.update(_this.rankingModel, _this.queryTermColorScale, contentList.getListHeight());
            docViewer.clear();
            tagCloud.clearEffects();

            s.onChange.call(this, rankingData, _this.selectedKeywords, status);
        },


        onTagDropped: function(index) {
            var stem = $('#urank-tag-'+index).attr('stem');
            var queryTermColor = _this.queryTermColorScale(stem);
            //var queryTermColor = _this.queryTermColorScale(_this.keywords[index].stem);
            tagBox.dropTag(index, queryTermColor);
            s.onTagDropped.call(this, index, queryTermColor);
        },

        onTagDeleted: function(index) {
            tagBox.deleteTag(index);
            tagCloud.restoreTag(index);
            s.onTagDeleted.call(this, index);
        },

        onTagInCloudMouseEnter: function(index) {
            tagCloud.hoverTag(index);
            s.onTagInCloudMouseEnter.call(this, index);
        },

        onTagInCloudMouseLeave: function(index) {
            tagCloud.unhoverTag(index);
            s.onTagInCloudMouseLeave.call(this, index);
        },

        onTagInCloudClick: function(index) {
            // TODO
            s.onTagInCloudClick.call(this, index);
        },

        onKeywordHintEnter: function(index) {
            tagCloud.keywordHintMouseEntered(index);
            s.onKeywordHintMouseEnter.call(this, index);
        },

        onKeywordHintLeave: function(index) {
            tagCloud.keywordHintMouseLeft(index);
            s.onKeywordHintMouseLeave.call(this, index);
        },

        onKeywordHintClick: function(index) {
            tagCloud.keywordHintClicked(index);
            s.onKeywordHintClick.call(this, index);
        },

        onDocumentHintClick: function(index) {
            tagCloud.documentHintClicked(index);
            var idsArray = _this.keywords[index].inDocument;
            contentList.highlightListItems(idsArray);
            visCanvas.highlightItems(idsArray).resize(contentList.getListHeight());

            s.onDocumentHintClick.call(this, index);
        },

        onTagInBoxMouseEnter: function(index) {
            // TODO
            s.onTagInBoxMouseEnter.call(this, index);
        },

        onTagInBoxMouseLeave: function(index) {
            // TODO
            s.onTagInBoxMouseLeave.call(this, index);
        },

        onTagInBoxClick: function(index) {
            // TODO
            s.onTagInBoxClick.call(this, index);
        },

        onItemClicked : function(documentId) {
            _this.selectedId = _this.selectedId === documentId ? STR_UNDEFINED : documentId;

            if(_this.selectedId !== STR_UNDEFINED) {    // select
                contentList.selectListItem(documentId);
                visCanvas.selectItem(documentId);
                docViewer.showDocument(_this.rankingModel.getDocumentById(documentId), _this.selectedKeywords.map(function(k){return k.stem}), _this.queryTermColorScale);
            }
            else {                   // deselect
                contentList.deselectAllListItems();
                visCanvas.deselectAllItems();
                docViewer.clear();
            }
            tagCloud.clearEffects();
            s.onItemClicked.call(this, documentId);
        },

        onItemMouseEnter: function(documentId) {
            contentList.hover(documentId);
            visCanvas.hoverItem(documentId);
            s.onItemMouseEnter.call(this, documentId);
        },

        onItemMouseLeave: function(documentId) {
            contentList.unhover(documentId);
            visCanvas.unhoverItem(documentId);
            s.onItemMouseLeave.call(this, documentId);
        },

        onFaviconClicked: function(documentId){
            contentList.toggleFavicon(documentId);
            s.onFaviconClicked.call(this, documentId);

            /**
             * Modified by Jorch
             * @type {{name: string, score: number}}
             */
            var scriptURL = '../server/save.php',
             date = new Date(),
             timestamp = date.getFullYear() + '-' + (parseInt(date.getMonth()) + 1) + '-' + date.getDate() + '_' + date.getHours() + '.' + date.getMinutes() + '.' + date.getSeconds(),
             urankState = _this.urank.getCurrentState(),
             gf = $('#select-download').val() == '2files' ?
             [{ filename: 'urank_selected_keywords_' + timestamp + '.txt', content: JSON.stringify(urankState.selectedKeywords) },
             { filename: 'urank_ranking_' + timestamp + '.txt', content: JSON.stringify(urankState.ranking) }] :
             [{ filename: 'urank_state_' + timestamp + '.txt', content: JSON.stringify(urankState) }];
            var obj = {
                name: 'Dhayalan',
                score: 100
            };
            var content  = JSON.stringify(obj);
            $.generateFile({ filename: "bookmarks.json", content: content, script: '../server/save.php' });
        },

        onWatchiconClicked: function(documentId) {
            contentList.toggleWatchListItem(documentId);
            s.onWatchiconClicked.call(this, documentId);
        },

        onRootMouseDown: function(event){
            event.stopPropagation();
            if(event.which == 1) {
                tagCloud.clearEffects();
            }
        },

        onRootClick: function(event) {
            if(event.which == 1) {
                contentList.clearEffects();
                visCanvas.clearEffects().resize(contentList.getListHeight());
                docViewer.clear();
            }
        },

        onParallelBlockScrolled: function(sender, offset) {
            if(sender === contentList)
                visCanvas.scrollTo(offset);
            else if(sender == visCanvas)
                contentList.scrollTo(offset);
        },

        onResize: function(event) {
            visCanvas.resize();
        },

        // Event handlers to return
        onRankByOverallScore: function() {
            _this.rankingMode = RANKING_MODE.overall_score;
            EVTHANDLER.onChange(_this.selectedKeywords);
            s.onRankByOverallScore.call(this);
        },

        /**
         * Created by Jorch
         */
        onFindNotLabeled: function(value,aux){
            console.log(value);
            value = {
                unlabelled:$('#chek-find-not-labeled').is(':checked') ? $('#chek-find-not-labeled').attr('value') : null,
                bot:$('#chek-find-botnet').is(':checked') ? $('#chek-find-botnet').attr('value') : null,
                notBot:$('#chek-find-normal').is(':checked') ? $('#chek-find-normal').attr('value') : null,
                all:$('#chek-find-All').is(':checked') ? $('#chek-find-All').attr('value') : null,
                initialIp:$('#filter-initial-port:checked').length > 0 ? $('#filter-initial-port').attr('value'): null,
                endIp:$('#filter-end-port:checked').length > 0 ? $('#filter-end-port').attr('value') : null,
                port:$('#filter-port:checked').length > 0 ? $('#filter-port').attr('value') : null,
                protocol:$('#filter-protocol:checked').length > 0 ? $('#filter-protocol').attr('value') : null
            }
            var list = [];
            _this.data.forEach(function(d, i){
                var label = d.title;
                var attributes = d.connection_id.split('-');
                var valid = true;
                if(value.unlabelled != null && !(label != 'Botnet' && label != 'Normal')) valid = false;
                if(valid && value.bot != null && label != 'Botnet') valid = false;
                if(valid && value.notBot != null && label != 'Normal') valid = false;
                //if(valid && value.all)
                if(valid && value.initialIp != null && value.initialIp != attributes[0]) valid = false;
                if(valid && value.endIp != null && value.endIp != attributes[1]) valid = false;
                if(valid && value.port != null && value.port != attributes[2]) valid = false;
                if(valid && value.protocol != null && value.protocol != attributes[3]) valid = false;

                if(valid){
                    list.push(d.id);
                }
            });

            contentList.selectManyListItem(list);

            var filters = value.unlabelled + ' ' + value.bot + ' ' + value.notBot + ' ' + value.all + ' (IP_0)' + value.initialIp + ' (IP_1)' + value.endIp+ ' (Port)' + value.port + ' (Protocol)' + value.protocol + ' ';
            enterLog('Filter '+filters);

        },
        /**
         * Created by Jorch
         */
        onEnterLog: function(value){
            var scriptURL = '../server/log.php',
                date = new Date(),
                timestamp = date.getFullYear() + '-' + (parseInt(date.getMonth()) + 1) + '-' + date.getDate() + '_' + date.getHours() + '.' + date.getMinutes() + '.' + date.getSeconds(),
                urankState = timestamp+' '+value,
                gf = [{ filename: 'urank_labeled_' + timestamp + '.txt', content: urankState }];//JSON.stringify(urankState)

            $.generateFile({ filename: "bookmarks.json", content: urankState, script: scriptURL });

            return false;
        },

        onFindBotnet:function(value){
            var botnets = [];
            _this.data.forEach(function(d, i){
                if(!value.currentTarget['checked']){
                    botnets.push(d.id);
                }
                else{
                    //console.log(d.index);
                    var label = d.title;

                    /*if(label.split(' ')[1] == 'Botnet'){
                     notLabeled.push(d.id);
                     }*/
                    if(label == 'Botnet'){
                        botnets.push(d.id);
                    }
                }

            });
            contentList.selectManyListItem(botnets);
        },
        /**
         * Created by Jorch
         */
        onChekFindNotLabeled: function(){
            alert('checked');
            var notLabeled = [];
            _this.data.forEach(function(d, i){
                //console.log(d.index);
                var label = d.title;
                if(label.split(' ')[1] == 'Botnet'){
                    notLabeled.push(d.id);
                }
            });
            //console.log(notLabeled);
            contentList.selectManyListItem(notLabeled);
        },

        onRankByMaximumScore: function() {
            _this.rankingMode = RANKING_MODE.max_score;
            EVTHANDLER.onChange(_this.selectedKeywords);
            s.onRankByMaximumScore.call(this);
        },

        onReset: function(event) {
            if(event) event.stopPropagation();
            contentList.reset();
            tagCloud.reset();
            tagBox.clear();
            visCanvas.reset();
            docViewer.clear();
            _this.rankingModel.reset();
            _this.selectedId = STR_UNDEFINED;
            _this.selectedKeywords = [];
            s.onReset.call(this);

            //enter Log
            enterLog('Ranking Reset');
        },

        onDestroy: function() {
            tagCloud.destroy();
            tagBox.destroy();
            contentList.destroy();
            visCanvas.destroy();
            docViewer.destroy();
        },

        onClear: function() {
            tagCloud.clear();
            tagBox.clear();
            docViewer.clear();
/*            contentList.destroy();
            visCanvas.destroy();*/
        },
        /**
         * Modified by Jorch
         */
        onUpdateTagsCloud: function(stf_value,pattern_value,length_value,order_by_periodicity,options){
            var o = $.extend(true, defaultLoadOptions, options || {});
            tagCloud.build(_this.keywords, _this.data, _this.tagColorScale, o.tagCloud, _this.keywordsDict,stf_value,pattern_value,length_value,order_by_periodicity);
        }
    };



    // Constructor
    function Urank(arguments) {

        _this = this;
        // default user-defined arguments
        s = $.extend(defaultInitOptions, arguments);

        var options = {
            contentList: {
                root: s.contentListRoot,
                onItemClicked: EVTHANDLER.onItemClicked,
                onItemMouseEnter: EVTHANDLER.onItemMouseEnter,
                onItemMouseLeave: EVTHANDLER.onItemMouseLeave,
                onFaviconClicked: EVTHANDLER.onFaviconClicked,
                onWatchiconClicked: EVTHANDLER.onWatchiconClicked,
                onScroll: EVTHANDLER.onParallelBlockScrolled
            },

            tagCloud: {
                root: s.tagCloudRoot,
                onTagInCloudMouseEnter: EVTHANDLER.onTagInCloudMouseEnter,
                onTagInCloudMouseLeave: EVTHANDLER.onTagInCloudMouseLeave,
                onTagInCloudClick: EVTHANDLER.onTagInCloudClick,
                onDocumentHintClick: EVTHANDLER.onDocumentHintClick,
                onKeywordHintMouseEnter : EVTHANDLER.onKeywordHintEnter,
                onKeywordHintMouseLeave : EVTHANDLER.onKeywordHintLeave,
                onKeywordHintClick : EVTHANDLER.onKeywordHintClick
            },

            tagBox: {
                root: s.tagBoxRoot,
                onChange: EVTHANDLER.onChange,
                onTagDropped: EVTHANDLER.onTagDropped,
                onTagDeleted: EVTHANDLER.onTagDeleted,
                onTagInBoxMouseEnter: EVTHANDLER.onTagInBoxMouseEnter,
                onTagInBoxMouseLeave: EVTHANDLER.onTagInBoxMouseLeave,
                onTagInBoxClick: EVTHANDLER.onTagInBoxClick
            },

            visCanvas: {
                root: s.visCanvasRoot,
                onItemClicked: EVTHANDLER.onItemClicked,
                onItemMouseEnter: EVTHANDLER.onItemMouseEnter,
                onItemMouseLeave: EVTHANDLER.onItemMouseLeave,
                onScroll: EVTHANDLER.onParallelBlockScrolled
            },

            docViewer: {
                root: s.docViewerRoot
            }
        };

        this.data = [];
        this.keywords = [];
        this.keywordsDict = {};
        this.rankingModel = new RankingModel();

        contentList = new ContentList(options.contentList);
        tagCloud = new TagCloud(options.tagCloud);
        tagBox = new TagBox(options.tagBox);
        visCanvas = new VisCanvas(options.visCanvas);
        docViewer = new DocViewer(options.docViewer);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  Miscelaneous
    /**
     * Modified by Jorch
     */
   /* var MISC2 = {
        getCurrentLabeled: function(){
            return{
                ranking: _this.rankingModel.getRanking().map(function(d){
                    return {
                        id: d.id,
                        label: d.title,
                        status: d.description + '\n'
                    }
                })
            };
        }
    };*/

    var MISC = {
        getCurrentState: function(){
            /*return {
                mode: _this.rankingMode,
                status: _this.rankingModel.getStatus(),
                selectedKeywords: _this.selectedKeywords.map(function(sk){ return { term: sk.term, weight: sk.weight } }),
                ranking: _this.rankingModel.getRanking().map(function(d){
                    return {
                        id: d.id,
                        title: d.title,
                        rankingPos: d.rankingPos,
                        overallScore: d.overallScore,
                        maxScore: d.maxScore,
                        positionsChanged: d.positionsChanged,
                        weightedKeywords: d.weightedKeywords.map(function(wk){ return { term: wk.term, weightedScore: wk.weightedScore } })
                    }
                })
            };*/
            var terms = '';
            //_this.selectedKeywords.map(function(sk){ terms = terms+'  ' + sk.term + '('+sk.weight+')' });
            //var text = 'Labeling using that terms: '+ terms+'\n';
            var text = '[\n';//'ID | Label | Keywords \n';
            var id_term = [];
            var result = [];
            this.rankingModel.getRanking().map(function(d){
                if('terms' in d){
                    //text = text + d.id +' | '+ d.title + ' | '+  d.terms+ '\n';//+ ' | ' + d.description+'\n';
                    id_term[d.id] = d.terms;
                }
                /*else{
                    text = text + d.id +' | '+ d.title + '\n';//+ ' | ' + d.description+'\n';
                }*/
            });
            this.data.map(function(d){
                result.push(
                    {
                        id: d.id,
                        title: d.title,
                        uri:"http://www.mendeley.com",
                        eexcessURI: "http://www.mendeley.com",
                        creator:"David J Reinkensmeyer, Jeremy L Emken, Steven C Cramer",
                        description: d.description,
                        collectionName: "",
                        keyword: d.id in id_term ? id_term[d.id]: d.keyword,
                        observation: d.observation,
                        connection_id: d.connection_id,
                        facets:{provider: "mendeley",year: "2004"}
                    }
                );

                //text = text + d.id +' | '+ d.title + '\n';
            });
            return result;
        }
    };



    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  Prototype


    Urank.prototype = {
        loadData: EVTHANDLER.onLoad,
        reset: EVTHANDLER.onReset,
        rankByOverallScore: EVTHANDLER.onRankByOverallScore,
        rankByMaximumScore: EVTHANDLER.onRankByMaximumScore,
        findNotLabeled: EVTHANDLER.onFindNotLabeled,
        enterLog:EVTHANDLER.onEnterLog,
        //findBotnet:EVTHANDLER.onFindBotnet,
        //checkfindNotLabeled: EVTHANDLER.onChekFindNotLabeled(),
        clear: EVTHANDLER.onClear,
        destroy: EVTHANDLER.onDestroy,
        getCurrentState: MISC.getCurrentState,
        updateTagsCloud: EVTHANDLER.onUpdateTagsCloud,
        onTagDropped:EVTHANDLER.onTagDropped,
        onChange:EVTHANDLER.onChange
        /**
         * Modified by Jorch
         */
        //getCurrentLabeled: MISC2.getCurrentLabeled()
    };

    return Urank;



})();
