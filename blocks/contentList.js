var ContentList = (function(){

    var _this;
    // Settings
    var s = {};
    // Classes
    var contentListClass = 'urank-list',
        hiddenScrollbarClass = 'urank-hidden-scrollbar',
        hiddenScrollbarInnerClass = 'urank-hidden-scrollbar-inner',
        listContainerClass = 'urank-list-container',
        ulClass = 'urank-list-ul',
        ulPaddingBottomclass = 'urank-list-ul-padding-bottom',
        liClass = 'urank-list-li',
        liLightBackgroundClass = 'urank-list-li-lightbackground',
        liDarkBackgroundClass = 'urank-list-li-darkbackground',
        liUnrankedClass = 'urank-list-li-unranked',
        liMovingUpClass = 'urank-list-li-movingup',
        liMovingDownClass = 'urank-list-li-movingdown',
        liNotMovingClass = 'urank-list-li-notmoving',
        liRankingContainerClass = 'urank-list-li-ranking-container',
        rankingPosClass = 'urank-list-li-ranking-pos',
        rankingPosMovedClass = 'urank-list-li-ranking-posmoved',
        liTitleContainerClass = 'urank-list-li-title-container',
        liTitleClass = 'urank-list-li-title',
        liButtonsContainerClass = 'urank-list-li-buttons-container',
        faviconClass = 'urank-list-li-button-favicon',
        faviconDefaultClass = 'urank-list-li-button-favicon-default',
        faviconOffClass = 'urank-list-li-button-favicon-off',
        faviconOnClass = 'urank-list-li-button-favicon-on',
        watchiconClass = 'urank-list-li-button-watchicon',
        watchiconOffClass = 'urank-list-li-button-watchicon-off',
        watchiconOnClass = 'urank-list-li-button-watchicon-on',
        watchiconDefaultClass = 'urank-list-li-button-watchicon-default',
        liHoveredClass = 'hovered',
        liWatchedClass = 'watched',
        // default-style classes
        ulClassDefault = ulClass + '-default',
        liClassDefault = liClass + '-default',
        liTitleClassDefault = liTitleClass + '-default';

    // Ids
    var liItem = '#urank-list-li-';

    var urankIdAttr = 'urank-id';
    // Helper
    var $root = $(''), $scrollable = $(''), $ul = $('');

    var onScroll = function(event){
        event.stopPropagation();
        s.onScroll.call(this, _this, $(this).scrollTop());
    };

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  Constructor

    function ContentList(arguments) {
        _this = this;
        s = $.extend({
            root: '',
            onItemClicked: function(document){},
            onItemMouseEnter: function(document){},
            onItemMouseLeave: function(document){},
            onFaviconClicked: function(document){},
            onWatchiconClicked: function(document){},
            defaultStyle: true
        }, arguments);

        this.data = [];
        this.selectedKeywords = [];
        this.multipleHighlightMode = false;
        this.actionLog = {};    // fields: doc_id, doc_title, timestamp
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  Internal functions

    var bindEventHandlers = function($li, id) {

        var onLiClick = function(event){
            event.stopPropagation();
            hideUnrankedListItems();
            if(!$(this).hasClass(liUnrankedClass))
                s.onItemClicked.call(this, id);
        };
        var onLiMouseEnter = function(event){
            event.stopPropagation(); s.onItemMouseEnter.call(this, id);
        };
        var onLiMouseLeave = function(event){
            event.stopPropagation(); s.onItemMouseLeave.call(this, id);
        };
        var onWatchiconClick = function(event){
            event.stopPropagation(); s.onWatchiconClicked.call(this, event.data);
        };
        var onFaviconClick = function(event){
            event.stopPropagation(); s.onFaviconClicked.call(this, event.data);
        };

        $li.off({
            click: onLiClick,
            mouseenter: onLiMouseEnter,
            mouseleave: onLiMouseLeave
        })
        .on({
            click: onLiClick,
            mouseenter: onLiMouseEnter,
            mouseleave: onLiMouseLeave
        })
        .off('click', '.'+watchiconClass, $li.attr(urankIdAttr), onWatchiconClick)
        .off('click', '.'+faviconClass, $li.attr(urankIdAttr), onFaviconClick)
        .on('click', '.'+watchiconClass, $li.attr(urankIdAttr), onWatchiconClick)
        .on('click', '.'+faviconClass, $li.attr(urankIdAttr), onFaviconClick);
    };


    var formatTitles = function(colorScale) {
        _this.data.forEach(function(d, i){
            var formattedTitle = (d.title.length > 60) ? (d.title.substring(0, 56) + '...') : d.title + '';
            formattedTitle = (_this.selectedKeywords.length == 0) ? formattedTitle : getStyledText(formattedTitle, _this.selectedKeywords, colorScale);
            $('.'+liClass+'['+urankIdAttr+'="'+d.id+'"]').find('.'+liTitleClass).html(formattedTitle);
        });
    }


    var updateLiBackground = function(){
        $('.'+liClass).removeClass(liLightBackgroundClass).removeClass(liDarkBackgroundClass).removeClass(liUnrankedClass);

        _this.data.forEach(function(d, i) {
            var backgroundClass = "";
            var not_backgroundClass = "";

            if(i % 2 == 0){
                backgroundClass = liLightBackgroundClass;
                not_backgroundClass = liDarkBackgroundClass;
            }
            else{
                backgroundClass = liDarkBackgroundClass;
                not_backgroundClass = liLightBackgroundClass;
            }
            //var backgroundClass = (i % 2 == 0) ? liLightBackgroundClass : liDarkBackgroundClass;
            $('.'+liClass+'['+urankIdAttr+'="'+d.id+'"]').removeClass(not_backgroundClass);
            $('.'+liClass+'['+urankIdAttr+'="'+d.id+'"]').addClass(backgroundClass);
        });
    };

    var showRankingPositions = function() {

        var color = function(d) {
            if(d.positionsChanged > 0) return "rgba(0, 200, 0, 0.8)";
            if(d.positionsChanged < 0) return "rgba(250, 0, 0, 0.8)";
            return "rgba(128, 128, 128, 0.8)";
        };

        var posMoved = function(d) {
            if(d.positionsChanged == 1000) return STR_JUST_RANKED;
            if(d.positionsChanged > 0) return "+" + d.positionsChanged;
            if(d.positionsChanged < 0) return d.positionsChanged;
            return "=";
        };

        _this.data.forEach(function(d, i){
            if(d.overallScore > 0){
                //var rankingDiv = $(liItem + '' + d.id).find('.'+liRankingContainerClass);
                var rankingDiv = $('.'+liClass+'['+urankIdAttr+'="'+d.id+'"]').find('.'+liRankingContainerClass);
                rankingDiv.css('visibility', 'visible');
                rankingDiv.find('.'+rankingPosClass).text(d.rankingPos);
                rankingDiv.find('.'+rankingPosMovedClass).css('color', color(d)).text(posMoved(d));
            }
        });
    };


    var hideUnrankedListItems = function() {

        if(_this.status !== RANKING_STATUS.no_ranking) {
            _this.data.forEach(function(d){
                var display = d.rankingPos > 0 ? '' : 'none';
                //$(liItem + '' + d.id).css('display', display);
                $('.'+liClass+'['+urankIdAttr+'="'+d.id+'"]').css('display', display);
            });
            $ul.addClass(ulPaddingBottomclass);
        }
        _this.multipleHighlightMode = false;
    };


    var removeMovingStyle = function() {
        $('.'+liClass).removeClass(liMovingUpClass).removeClass(liMovingDownClass);
    };


    var stopAnimation = function(){
        $('.'+liClass).stop(true, true);
        removeMovingStyle();
        if(_this.animationTimeout) clearTimeout(_this.animationTimeout);
    };



    var sort = function(){

        var start = $.now();
        var liHtml = [];

        _this.data.forEach(function(d, i){
            var $current = $('.'+liClass+'['+urankIdAttr+'="'+d.id+'"]').css('top', '');
            var $clon = $current.clone(true);
            liHtml.push($clon);
            $current.remove();
        });

        $ul.empty();
        liHtml.forEach(function(li){
            $ul.append(li);
        });
    };


    var animateAccordionEffect = function() {
        var timeLapse = 50;
        var easing = 'swing';

        _this.data.forEach(function(d, i){

            var $item = $('.'+liClass+'['+urankIdAttr+'="'+d.id+'"]');
            if(d.rankingPos > 0) {
                var shift = (i+1) * 5;
                var duration = timeLapse * (i+1);

                $item.animate({ top: shift }, 0, easing)
                .queue(function(){
                    $(this).animate({ top: 0 }, duration, easing)
                })
                .queue(function(){
                    $(this).css('top', '');
                })
                .dequeue();
            }
        });
    };



    var animateResortEffect = function() {
        var duration = 1500;
        var easing = 'swing';

        var acumHeight = 0;
        var listTop = $ul.position().top;

        _this.data.forEach(function(d, i){
            if(d.rankingPos > 0) {
                //var $item = $(liItem +''+ d.id);
                var $item = $('.'+liClass+'['+urankIdAttr+'="'+d.id+'"]');
                var itemTop = $item.position().top;
                var shift = listTop +  acumHeight - itemTop;
                var movingClass = (d.positionsChanged > 0) ? liMovingUpClass : ((d.positionsChanged < 0) ? liMovingDownClass : '');

                $item.addClass(movingClass);
                $item.animate({"top": '+=' + shift+'px'}, duration, easing);

                acumHeight += $item.fullHeight();
            }
        });
    };


    var animateUnchangedEffect = function () {
        var duration = 1000;
        var easing = 'linear';

        _this.data.forEach(function(d, i) {
            //var $item = $(liItem +''+ d.id);
            var $item = $('.'+liClass+'['+urankIdAttr+'="'+d.id+'"]');
            var startDelay = (i+1) * 30;

            setTimeout(function() {
                $item.addClass(liNotMovingClass);
                // item.removeClass(liNotMovingClass, duration, easing);
            }, startDelay);
        });
    };





    var buildCustomList = function() {
        var c = {
            root: _this.opt.customOptions.selectors.root,
            ul: _this.opt.customOptions.selectors.ul,
            liClass: _this.opt.customOptions.selectors.liClass,
            liTitle: _this.opt.customOptions.selectors.liTitle,
            liRankingContainer: _this.opt.customOptions.selectors.liRankingContainer,
            watchicon: _this.opt.customOptions.selectors.watchicon,
            favicon: _this.opt.customOptions.selectors.favicon,
            liHoverClass: _this.opt.customOptions.classes.liHoverClass,
            liLightBackgroundClass: _this.opt.customOptions.classes.liLightBackgroundClass,
            liDarkBackgroundClass: _this.opt.customOptions.classes.liDarkBackgroundClass,
            hideScrollbar: _this.opt.customOptions.misc.hideScrollbar
        };

        $ul = $(c.ul).addClass(ulClass);
        $root = $(c.root);

        if(c.hideScrollbar) {
            var $ulCopy = $ul.clone(true);
            $root.empty().addClass(hiddenScrollbarClass);
            $scrollable = $('<div></div>').appendTo($root)
                .addClass(hiddenScrollbarInnerClass)
                .on('scroll', onScroll)
                .append($ulCopy);
            $ul = $('.'+ulClass);
        }
        else {
            $scrollable = $root;
        }


        $(c.liClass).each(function(i, li){
            var $li = $(li),
                id = _this.data[i].id;

            $li.addClass(liClass).attr(urankIdAttr, id);
            $li.find(c.liTitle).addClass(liTitleClass);

            var $rankingDiv = $li.find(c.liRankingContainer).empty().addClass(liRankingContainerClass).css('visibility', 'hidden');
            $("<div></div>").appendTo($rankingDiv).addClass(rankingPosClass);
            $("<div></div>").appendTo($rankingDiv).addClass(rankingPosMovedClass);

            $li.find(c.watchicon).addClass(watchiconClass+' '+watchiconOffClass);
            $li.find(c.favicon).addClass(faviconClass+' '+faviconOffClass);

            bindEventHandlers($li, id);
        });

        liHoveredClass = c.liHoverClass == '' ? liHoveredClass : c.liHoverClass;
        liLightBackgroundClass = c.liLightBackgroundClass == '' ? liLightBackgroundClass : c.liLightBackgroundClass;
        liDarkBackgroundClass = c.liDarkBackgroundClass == '' ? liDarkBackgroundClass : c.liDarkBackgroundClass;

    };
    /**
     * Creatin HeatMap for visual representation
     * @param connection
     * @returns {Array}
     */
    var createVisualRepresentation = function(connection){
        //Periodicity feature
        var sNP = $('<label id="representation-snp" style="color: transparent;padding: 5px;border-right:1px solid #ffffff ">M</label>'), rep_sNP = /[R-Z]/, count_sNP = 0;
        var wNP = $('<label id="representation-wnp" style="color: transparent;padding: 5px;border-right:1px solid #ffffff ">M</label>'), rep_wNP = /[r-z]/, count_wNP = 0;
        var wP = $('<label id="representation-wp" style="color: transparent;padding: 5px;border-right:1px solid #ffffff ">M</label>'), rep_wP = /[A-I]/, count_wP = 0;
        var sP = $('<label id="representation-sp" style="color: transparent;padding: 5px;border-right:1px solid #ffffff ">M</label>'), rep_sP = /[a-i]/, count_sP = 0;
        //Duration feature
        var dS = $('<label id="representation-dS" style="color: transparent;padding: 5px;border-right:1px solid #ffffff; margin-left:5px; ">M</label>'), rep_dS = {a:1,A:1,r:1,R:1,d:1,D:1,u:1,U:1,g:1,G:1,x:1,X:1}, count_dS = 0;
        var dM = $('<label id="representation-dM" style="color: transparent;padding: 5px;border-right:1px solid #ffffff ">M</label>'), rep_dM = {b:1,B:1,s:1,S:1,e:1,E:1,v:1,V:1,h:1,H:1,y:1,Y:1}, count_dM = 0;
        var dL = $('<label id="representation-dL" style="color: transparent;padding: 5px;border-right:1px solid #ffffff ">M</label>'), rep_dL = {c:1,C:1,t:1,T:1,f:1,F:1,w:1,W:1,i:1,I:1,z:1,Z:1}, count_dL = 0;
        //Size feature
        var sS = $('<label id="representation-sS" style="color: transparent;padding: 5px;border-right:1px solid #ffffff; margin-left:5px;">M</label>'), rep_sS = {a:1,A:1,b:1,B:1,c:1,C:1,r:1,R:1,s:1,S:1,t:1,T:1}, count_sS = 0;
        var sM = $('<label id="representation-sM" style="color: transparent;padding: 5px;border-right:1px solid #ffffff ">M</label>'), rep_sM = {d:1,D:1,e:1,E:1,f:1,F:1,u:1,U:1,v:1,V:1,w:1,W:1}, count_sM = 0;
        var sL = $('<label id="representation-sL" style="color: transparent;padding: 5px;border-right:1px solid #ffffff ">M</label>'), rep_sL = {g:1,G:1,h:1,H:1,i:1,I:1,x:1,X:1,y:1,Y:1,z:1,Z:1}, count_sL = 0;

        var description = connection.description;
        var count  = description.length;
        var i = count
        while(i--){
            var letter = description[i];
            //Count periodicity feature
            if(rep_sNP.test(letter)){
                count_sNP ++;
            }
            else if(rep_wNP.test(letter)){
                count_wNP++;
            }
            else if(rep_wP.test(letter)){
                count_wP++;
            }
            else if(rep_sP.test(letter)){
                count_sP++;
            }

            //Count duration feature
            if(letter in rep_dS){
                count_dS++;
            }
            else if(letter in rep_dM){
                count_dM++;
            }
            else if(letter in rep_dL){
                count_dL++;
            }

            //Count size feature
            if(letter in rep_sS){
                count_sS++;
            }
            else if(letter in rep_sM){
                count_sM++;
            }
            else if(letter in rep_sL){
                count_sL++;
            }
        }

        var count_of_letter = count_sNP + count_wNP + count_wP + count_sP;

        //var colors = ['#ffefd8','#ffe7c4','#ffdfb1','#ffd89d','#ffd089','#ffc876','#ffc062','#ffb84f','#ffb03b','#ffa827','#ffa014','#ff9800','#ec8d00','#d88100','#c47500','#b16900','#9d5e00','#895200','#623b00','#3b2300']
        var colors = ['#00008F','#0000BF','#0000EF','#001FFF','#005FFF','#008FFF','#00BFFF','#00EFFF','#2FFFCF','#5FFF9F','#AFFF4F','#DFFF1F','#FFDF00','#FFAF00','#FF7F00','#FF4F00','#FF0F00','#DF0000','#AF0000','#7F0000']
        var ranges = 101 / (colors.length);
        //Count periodicity feature
        var porcent_count_sNP = (count_sNP * 100)/ count_of_letter;
        sNP.css('background',colors[Math.floor(porcent_count_sNP/ranges)]);
        /*if(porcent_count_sNP < 25){
            sNP.css('background','#FFF0A5');
        }
        else if(porcent_count_sNP > 25 && porcent_count_sNP < 50){
            sNP.css('background','#FFB03B');
        }
        else if(porcent_count_sNP > 50 && porcent_count_sNP < 75){
            sNP.css('background','#B64926');
        }
        else{
            sNP.css('background','#8E2800');
        }*/

        var porcent_count_wNP = (count_wNP * 100)/ count_of_letter;
        wNP.css('background',colors[Math.floor(porcent_count_wNP/ranges)]);
        /*if(porcent_count_wNP < 25){
            wNP.css('background','#FFF0A5');
        }
        else if(porcent_count_wNP > 25 && porcent_count_wNP < 50){
            wNP.css('background','#FFB03B');
        }
        else if(porcent_count_wNP > 50 && porcent_count_wNP < 75){
            wNP.css('background','#B64926');
        }
        else{
            wNP.css('background','#8E2800');
        }*/

        var porcent_count_wP = (count_wP * 100)/ count_of_letter;
        wP.css('background',colors[Math.floor(porcent_count_wP/ranges)]);
        /*if(porcent_count_wP < 25){
            wP.css('background','#FFF0A5');
        }
        else if(porcent_count_wP > 25 && porcent_count_wP < 50){
            wP.css('background','#FFB03B');
        }
        else if(porcent_count_wP > 50 && porcent_count_wP < 75){
            wP.css('background','#B64926');
        }
        else{
            wP.css('background','#8E2800');
        }*/

        var porcent_count_sP = (count_sP * 100)/ count_of_letter;
        sP.css('background',colors[Math.floor(porcent_count_sP/ranges)]);
        /*if(porcent_count_sP < 25){
            sP.css('background','#FFF0A5');
        }
        else if(porcent_count_sP > 25 && porcent_count_sP < 50){
            sP.css('background','#FFB03B');
        }
        else if(porcent_count_sP > 50 && porcent_count_sP < 75){
            sP.css('background','#B64926');
        }
        else{
            sP.css('background','#8E2800');
        }*/

        //Count duration feature
        var porcent_count_dS = (count_dS * 100)/ count_of_letter;
        dS.css('background',colors[Math.floor(porcent_count_dS/ranges)]);
        /*if(porcent_count_dS < 3.34){
            dS.css('background','#FFF0A5');
        }
        else if(porcent_count_dS > 3.34 && porcent_count_dS < 6.67){
            dS.css('background','#FFB03B');
        }
        else if(porcent_count_dS > 6.67){
            dS.css('background','#B64926');
        }*/

        var porcent_count_dM = (count_dM * 100)/ count_of_letter;
        dM.css('background',colors[Math.floor(porcent_count_dM/ranges)]);
        /*if(porcent_count_dM < 3.34){
            dM.css('background','#FFF0A5');
        }
        else if(porcent_count_dM > 3.34 && porcent_count_dM < 6.67){
            dM.css('background','#FFB03B');
        }
        else if(porcent_count_dM > 6.67){
            dM.css('background','#B64926');
        }*/

        var porcent_count_dL = (count_dL * 100)/ count_of_letter;
        dL.css('background',colors[Math.floor(porcent_count_dL/ranges)]);
        /*if(porcent_count_dL < 3.34){
            dL.css('background','#FFF0A5');
        }
        else if(porcent_count_dL > 3.34 && porcent_count_dL < 6.67){
            dL.css('background','#FFB03B');
        }
        else if(porcent_count_dL > 6.67){
            dL.css('background','#B64926');
        }*/

        //Count size feature
        var porcent_count_sS = (count_sS * 100)/ count_of_letter;
        sS.css('background',colors[Math.floor(porcent_count_sS/ranges)]);
        /*if(porcent_count_sS < 3.34){
            sS.css('background','#FFF0A5');
        }
        else if(porcent_count_sS > 3.34 && porcent_count_sS < 6.67){
            sS.css('background','#FFB03B');
        }
        else if(porcent_count_sS > 6.67){
            sS.css('background','#B64926');
        }*/

        var porcent_count_sM = (count_sM * 100)/ count_of_letter;
        sM.css('background',colors[Math.floor(porcent_count_sM/ranges)]);
        /*if(porcent_count_sM < 3.34){
            sM.css('background','#FFF0A5');
        }
        else if(porcent_count_sM > 3.34 && porcent_count_sM < 6.67){
            sM.css('background','#FFB03B');
        }
        else if(porcent_count_sM > 6.67){
            sM.css('background','#B64926');
        }*/

        var porcent_count_sL = (count_sL * 100)/ count_of_letter;
        sL.css('background',colors[Math.floor(porcent_count_sL/ranges)]);
        /*if(porcent_count_sL < 3.34){
            sL.css('background','#FFF0A5');
        }
        else if(porcent_count_sL > 3.34 && porcent_count_sL < 6.67){
            sL.css('background','#FFB03B');
        }
        else if(porcent_count_sL > 6.67){
            sL.css('background','#B64926');
        }*/

        return [sP,wP,wNP,sNP,dS,dM,dL,sS,sM,sL]

    }

    var buildDefaultList = function() {
        $root.empty().addClass(hiddenScrollbarClass);
        $scrollable = $('<div></div>').appendTo($root)
            .addClass(hiddenScrollbarInnerClass)
            .on('scroll', onScroll);

        $ul = $('<ul></ul>').appendTo($scrollable).addClass(ulClass +' '+ ulClassDefault);

        _this.data.forEach(function(d, i){
            // li element
            var $li = $('<li></li>', { 'urank-id': d.id }).appendTo($ul).addClass(liClass +' '+ liClassDefault);
            // ranking section
            var $rankingDiv = $("<div></div>").appendTo($li).addClass(liRankingContainerClass).css('visibility', 'hidden');
            $("<div></div>").appendTo($rankingDiv).addClass(rankingPosClass);
            $("<div></div>").appendTo($rankingDiv).addClass(rankingPosMovedClass);

            /**
             * Modified by Jorch
             * Adding traffic light in the connection list to indicate the labeling process
             */
            var trafic_ligth = 'yellow-circle';
            switch (d.title) {
                case 'Botnet': trafic_ligth = 'red-circle'; break;
                case 'Normal': trafic_ligth = 'green-circle'; break;
                default: break;
            }
            var ligth_circle = '<label><span urank-span-id="'+ d.id+'" class="urank-list-li-button-favicon-default-left '+trafic_ligth+' traffic-ligth"></span></label>';
            // title section
            var $titleDiv = $("<div></div>").appendTo($li).addClass(liTitleContainerClass);
            var html = createVisualRepresentation(d);//&nbsp;
            var index = i+1 < 10 ? (i+1)+'-'+'&nbsp;&nbsp;' : (i+1)+'-';
            var list_element_container = $('<div><div style="float: left; width: 20%">'+ligth_circle+'<label>'+index+'</label></div></div>', { id: 'urank-list-li-title-' + i, class: liTitleClass +' '+ liTitleClassDefault, html: html, title: d.title + '\n' + d.description }).appendTo($titleDiv);
            var visual_representation = $('<div style="float: left; width: 75%"></div>').appendTo(list_element_container);
            html.forEach(function(label){
               label.appendTo(visual_representation);
            });

            // buttons sectionh
            var $buttonsDiv = $("<div></div>").appendTo($li).addClass(liButtonsContainerClass);

            /**
             * Modified by Jorch
             * Adding traffic light in the connection list to indicate the labeling process

            var trafic_ligth = 'yellow-circle';
            switch (d.title) {
                case 'Botnet': trafic_ligth = 'red-circle'; break;
                case 'Normal': trafic_ligth = 'green-circle'; break;
                default: break;
            }
            $("<span>",{'urank-span-id': d.id}).appendTo($buttonsDiv).addClass(faviconDefaultClass+' '+trafic_ligth+' '+'traffic-ligth');*/

            $("<span style='margin-left: 8px'>").appendTo($buttonsDiv).addClass(watchiconClass+' '+watchiconDefaultClass+' '+watchiconOffClass);
            $("<span style='margin-left: -8px'>").appendTo($buttonsDiv).addClass(faviconClass+' '+faviconDefaultClass+' '+faviconOffClass);
            // Subtle animation
            $li.animate({'top': 5}, {
                'complete': function(){
                    $(this).animate({'top': ''}, (i+1)*100, 'swing', function(){
                        bindEventHandlers($li, d.id);
                    });
                }
            });
        });
    };


    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  Prototype methods

    var _build = function(data, opt) {
        this.originalData = data.slice();
        this.data = data.slice();
        this.selectedKeywords = [];
        this.status = RANKING_STATUS.no_ranking;
        this.opt = opt;
        $root = $(s.root).addClass(contentListClass);

        if(opt != null && this.opt.custom)
            buildCustomList();
        else
            buildDefaultList();

        formatTitles();
        updateLiBackground();
    };



    /**
    * @private     * Description
    * @param {type} data : current ranking
    * @param {type} status Description
    */
    var _update = function(data, status, selectedKeywords, colorScale) {


        this.data = (status != RANKING_STATUS.no_ranking) ? data.slice() : this.data;
        this.selectedKeywords = selectedKeywords.map(function(k){ return k.stem });
        this.status = status;

        var resortDelay = 1500,
            unchangedDuration = 1000,
            unchangedEasing = 'linear',
            removeDelay = 3000;

        stopAnimation();
        this.deselectAllListItems();
        formatTitles(colorScale);
        showRankingPositions();
        hideUnrankedListItems();

        $ul.addClass(ulPaddingBottomclass);

        var updateNew = function(){
            updateLiBackground();
            sort();
            animateAccordionEffect();
        };

        var updateUpdated = function(){
            updateLiBackground();
            animateResortEffect();
            return setTimeout(sort, resortDelay);
        };

        var updateUnchanged = function(){
            animateUnchangedEffect(unchangedDuration, unchangedEasing);
        };

        var updateFunc = {};
        updateFunc[RANKING_STATUS.new] = updateNew;
        updateFunc[RANKING_STATUS.update] = updateUpdated;
        updateFunc[RANKING_STATUS.unchanged] = updateUnchanged;
        updateFunc[RANKING_STATUS.no_ranking] = _this.reset;
        //  When animations are triggered too fast and they can't finished in order, older timeouts are canceled and only the last one is executed
        //  (list is resorted according to last ranking state)
        this.animationTimeout = updateFunc[this.status].call(this);

        setTimeout(removeMovingStyle, removeDelay);

        /**
         * Modified by Jorch
         */
        $('#doc-viewer-detail').css('display','none');
        $('.urank-docviewer-content-section p').html('');
        $('#doc-viewer-top').html('');
        $('#doc-viewer-left').html('');

    };



    var _reset = function() {
        //this.build(this.data, this.opt);
        this.data = this.originalData.slice();
        this.selectedKeywords = [];
        updateLiBackground();
        sort();
        formatTitles();
        $('.'+liClass).show().find('.'+liRankingContainerClass).css('visibility', 'hidden');

        $ul.removeClass(ulPaddingBottomclass);
    };



    var _selectListItem = function(id) {
        stopAnimation();
        $('.'+liClass).css("opacity", "0.3");
        //$(liItem + '' + id).css("opacity", "1");
        $('.'+liClass+'['+urankIdAttr+'="'+id+'"]').css("opacity", "1");
    };

    /**
     * Created by Jorch
     */
    var _selectManyListItem = function(idArray) {
        stopAnimation();
        //$('.'+liClass).css("opacity", "0.2");
        //$('.'+liClass).css("display", "none");
        $('.'+liClass).addClass('li-nonshow');
        for(var i = 0; i < idArray.length; i++){
            var id = idArray[i];
            //$('.'+liClass+'['+urankIdAttr+'="'+id+'"]').css("display", "block");
            $('.'+liClass+'['+urankIdAttr+'="'+id+'"]').removeClass('li-nonshow');
            $('.'+liClass+'['+urankIdAttr+'="'+id+'"]').addClass('li-show');
        }
        return false;

    };

    var _deselectAllListItems = function() {
        $('.'+liClass).css('opacity', '');
    };


    // receives actual index
    var _hover = function(id) {
        //$(liItem +''+ id).addClass(liHoveredClass);
        $('.'+liClass+'['+urankIdAttr+'="'+id+'"]').addClass(liHoveredClass);
    };


    var _unhover = function(id) {
        //$(liItem +''+ id).removeClass(liHoveredClass);
        $('.'+liClass+'['+urankIdAttr+'="'+id+'"]').removeClass(liHoveredClass);
    };


    var _highlightListItems = function(idArray) {
        stopAnimation();   // fix bug
        $('.'+liClass).css('opacity', .2);
        idArray.forEach(function(id){
            //var $li = $(liItem+''+id);
            var $li = $('.'+liClass+'['+urankIdAttr+'="'+id+'"]');
            if(!$li.is(':visible'))
                $li.removeClass(liDarkBackgroundClass).removeClass(liLightBackgroundClass).addClass(liUnrankedClass);
            $li.css({ display: '', opacity: ''});
        });
        $ul.removeClass(ulPaddingBottomclass);
        _this.multipleHighlightMode = true;

    };



    var _clearAllFavicons = function(){
        $('.'+liClass).find(' .' + faviconClass).removeClass(faviconOnClass);//.addClass(faviconOffClass);
    };


    var _toggleFavicon = function(id){
        //var favIcon = $(liItem + '' + id).find(' .' + faviconClass);
        var favIcon = $('.'+liClass+'['+urankIdAttr+'="'+id+'"]').find(' .' + faviconClass);
        var classToAdd = favIcon.hasClass(faviconOffClass) ? faviconOnClass : faviconOffClass;
        var classToRemove = classToAdd === faviconOnClass ? faviconOffClass : faviconOnClass;
        favIcon.switchClass(classToRemove, classToAdd);
    };


    var _toggleWatchListItem = function(id){
        var $li = $('.'+liClass+'['+urankIdAttr+'="'+id+'"]');
        var watchIcon = $li.find(' .' + watchiconClass);
        var classToAdd = watchIcon.hasClass(watchiconOffClass) ? watchiconOnClass : watchiconOffClass;
        var classToRemove = classToAdd === watchiconOnClass ? watchiconOffClass : watchiconOnClass;
        watchIcon.switchClass(classToRemove, classToAdd);
        $li.toggleClass(liWatchedClass);
    };


    var _clearEffects = function() {
        this.deselectAllListItems();
        if(this.multipleHighlightMode) hideUnrankedListItems();
    };


    var _destroy = function() {
        if(!this.opt || !this.opt.custom) return;

        if(!this.opt.custom)
            $root.empty().removeClass(contentListClass+' '+hiddenScrollbarClass);
        else {
            if($root.hasClass(hiddenScrollbarClass)) {
                var $ulCopy = $ul.clone(true);
                $root.empty().removeClass(hiddenScrollbarClass).append($ulCopy);
            }
            $root.removeClass(contentListClass);
            $('.'+ulClass).removeClass(ulClass);
            $('.'+liClass).removeAttr(urankIdAttr)
                .removeClass(liClass+' '+liLightBackgroundClass+' '+liDarkBackgroundClass+' '+liUnrankedClass+' '+liMovingUpClass+' '+liMovingDownClass+' '+liNotMovingClass);
            $('.'+liRankingContainerClass).empty().removeClass(liRankingContainerClass);
            $('.'+liTitleClass).removeClass(liTitleClass);
            $('.'+watchiconClass).removeClass(watchiconClass+' '+watchiconOffClass+' '+watchiconOnClass);
            $('.'+faviconClass).removeClass(faviconClass+' '+faviconOffClass+' '+faviconOnClass);
        }
    };


    var _scrollTo = function(scroll) {
        $scrollable.off('scroll', onScroll)
            .scrollTop(scroll)
            .on('scroll', onScroll);
    };

    var _getListHeight = function() {
        return $ul.height();
    };


    // Prototype
    ContentList.prototype = {
        build: _build,
        reset: _reset,
        update: _update,
        hover: _hover,
        unhover: _unhover,
        selectListItem: _selectListItem,
        selectManyListItem: _selectManyListItem,
        deselectAllListItems: _deselectAllListItems,
        highlightListItems: _highlightListItems,
        clearAllFavicons: _clearAllFavicons,
        toggleFavicon: _toggleFavicon,
        toggleWatchListItem: _toggleWatchListItem,
        clearEffects: _clearEffects,
        destroy: _destroy,
        scrollTo: _scrollTo,
        getListHeight: _getListHeight
    };

    return ContentList;
})();


