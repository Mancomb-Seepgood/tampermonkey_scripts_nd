// ==UserScript==
// @name        Wagtail Monkey
// @namespace   ND
// @author      netDoktor
// @include     /^https?://www\.netdoktor\.de/
// @include     /^https?://www\.netdoktor\.at/
// @include     /^https?://www\.netdoktor\.ch/
// @include     /^https?://rezepte\.netdoktor\.at/
// @include     /^https?://stage\.tech\.netdoktor\.de/
// @include     /^https?://stage\.tech\.netdoktor\.at/
// @include     /^https?://stage\.tech\.netdoktor\.ch/
// @version     4.0
// @grant       none
// @require     https://cdnjs.cloudflare.com/ajax/libs/vue/2.6.14/vue.min.js
// @require     https://code.jquery.com/jquery-3.4.1.min.js
// @run-at      document-body
// @noframes
// ==/UserScript==

(function (window) {
    let version = "4.0";
    let appTemplate = `<style>
  .vue-monkey {
    display: none;
    z-index: 10000001;
    position: fixed; top: 96px; left: 0px;
    width: 100%; height: 100%;
    padding: 10px;
    font-family:Roboto, sans-serif; font-size:14px; -webkit-font-smoothing:antialiased; -webkit-tap-highlight-color:rgba(0, 0, 0, 0);
    pointer-events:none;
  }
  .vue-monkey .hidden {
    display: none;
  }
  .vue-monkey .shown {
    display: block;
  }
  .vue-monkey .closed-layer {
    margin-left: auto; margin-right: auto;
    padding-top: 8px;
  }
  .vue-monkey .closed-layer .image {
    width: 50px;
    height: 50px;
    border-radius:50%;
    background-size: 50px 50px;
    display: block;
    pointer-events:auto;
  }
  .vue-monkey .closed-layer .image.standard {
    background-image: url('https://cdn.netdoktor.de/images/internal/ir-monkey.jpg');
  }
  .vue-monkey .closed-layer .image.campaign {
    background-image: url('https://cdn.netdoktor.de/images/internal/ir_monkey_gold.png');
  }
  .vue-monkey .closed-layer .id-label {
    pointer-events:auto;
    text-align: center;
    margin-top: 4px;
    width: 50px; height: 20px;
    background-color: rgba(255, 255, 255, 0.9);
    display: none;
  }
  .vue-monkey .closed-layer .id-label .id-text {
    pointer-events:auto;
    font-family:Roboto, sans-serif; font-size:10px; -webkit-font-smoothing:antialiased; -webkit-tap-highlight-color:rgba(0, 0, 0, 0);
  }
  .vue-monkey .open-layer {
    pointer-events:auto;
    background-color: rgba(255, 255, 255, 0.8);
    color: rgba(0, 0, 0, 0.8);
    margin-left: auto; margin-right: auto;
    padding-top: 16px;
  }
  .vue-monkey .info-block {
    font-family:Roboto, sans-serif; line-height:18px; font-size: 14px; -webkit-font-smoothing:antialiased; -webkit-tap-highlight-color:rgba(0, 0, 0, 0);
    padding: 8px 16px 8px 16px;
  }
  .vue-monkey .info-block .title {
    font-weight: 600;
  }
  .vue-monkey .info-block .info-block-detail {
    padding: 4px 4px 0 4px;
  }
  .vue-monkey .info-block .info-block-detail .label {
    font-size: 12px;
    font-style: italic;
  }
  .vue-monkey .info-block .info-block-detail .value {
    padding-left: 8px;
  }
  .vue-monkey .fixed-block {
    pointer-events:auto;
    padding: 0 8px 0 20px;
  }
  .vue-monkey .fixed-block .goto-id {
    pointer-events:auto;
  }
  .vue-monkey .fixed-block .form-label {
    font-size: 12px;
    font-style: italic;
    padding-right: 8px;
  }
  .vue-monkey .fixed-block .button {
    height: 20px;
    min-width: 66px;
    margin-top: 0;
    margin-bottom: 0;
  }

</style>
<div id="vue-monkey-app" class="vue-monkey" :style="{ display: mountDisplay }">
  <div class="closed-layer" :class="[isClosed ? 'shown' : 'hidden']">
    <div v-on:click="toggle" class="image" :class="{ standard: !isCampaign, campaign: isCampaign }"></div>
    <div v-on:click="copyContentId" class="id-label" :style="{ display: labelStyle }"><span class="id-text">{{message}}<span></div>
    <input type="hidden" id="coptToClipboard" :value="copyString">
  </div>
  <div class="open-layer" :class="[!isClosed ? 'shown' : 'hidden']" v-on:click="toggle">
    <div class="fixed-block">
      <form class="goto-id" @submit="gotoArticle" onsubmit="return false;">
      <span class="form-label">Go to article in Wagtail admin:</span><input id="gotoId" type="text" v-model="articleid" value="" placeholder="Enter article ID and press enter"/>
    </div>
    <div class="fixed-block">
      <span class="form-label">Switch environment:</span><button class="button" @click="gotoEnv('stage')">stage</button><button class="button" @click="gotoEnv('prod')">prod</button>
    </div>
    <info-block
      v-for="post in posts"
      v-bind:post="post"
    ></info-block>

  </div>
</div>`;

    let vueMonkeyApp = new Vue({
        data: {
            didMount: false,
            message: "",
            styleButtonBackground: "'https://cdn.netdoktor.de/images/internal/ir-monkey.jpg'",
            isCampaign: false,
            labelStyle: "none",
            isClosed: true,
            mountDisplay: "none",
            copyString: "",
            posts: [
            ],
            articleid: null,
        },
        mounted: function () {
            console.log("vue monkey mounted")

            // reference dataLayer
            var gtm = google_tag_manager["GTM-5ZG6TN3D"];
            this.dataLayer = gtm.dataLayer;

            // page id
            this.message = contentId(this.dataLayer);

            // cs id
            this.isCampaign = isCampaignDataLayer(this.dataLayer);

            this.labelStyle = "block";
            this.mountDisplay = "block";

            metaInformation(this.dataLayer, this.posts);
            bcnInformation(this.dataLayer, this.posts);
            onPageformation(this.dataLayer, this.posts);
            helpInformation(this.posts);

            this.posts.push({
            title: "Wagtail Monkey",
            info: [
                { label: "Version", value: version },
                ]});
        },
        created: function () {
            console.log("vue monkey created");
            window.addEventListener('keydown', (e) => {
                console.log(e.key);
                if (e.key == 'Escape') {
//                    this.showModal = !this.showModal;
                }
            });
        },
        methods: {
            toggle: function (event) {
                console.log("toggled");
                if((event.srcElement !== undefined) && (event.srcElement.id == "gotoId")) {
                    return;
                }
                if((event.srcElement !== undefined) && (event.srcElement.tagName == "BUTTON")) {
                    return;
                }
                console.log(event);
                this.isClosed = !this.isClosed;
            },
            copyContentId: function (event) {
                this.copyString = this.message;
                let copyToClipboard = document.querySelector('#coptToClipboard');
                copyToClipboard.setAttribute('type', 'text');
                copyToClipboard.select();
                try {
                    var successful = document.execCommand('copy');
                    var msg = successful ? 'successful' : 'unsuccessful';
                    console.log('Id was copied ' + msg);
                } catch (err) {
                    console.log('Oops, unable to copy');
                }
                copyToClipboard.setAttribute('type', 'hidden');
                window.getSelection().removeAllRanges();
            },
            gotoArticle: function (event) {
                console.log(this.articleid);
                window.location.href = "https://admin.netdoktor.de/admin/pages/" + this.articleid;
            },
            gotoEnv: function(envName) {
                var envDomain = 'https://www.netdoktor.de';
                if(envName == 'stage') envDomain = 'https://stage.tech.netdoktor.de';
                window.location.href = envDomain + window.location.pathname;
            }
        }
    });

    Vue.component('info-block', {
        props: ['post'],
        template: `<div class="info-block"><span class="title">{{ post.title }}</span><info-block-label v-for="info in post.info" v-bind:info="info"></info-block-label></div>`
    });

    Vue.component('info-block-label', {
        props: ['info'],
        template: `<div class="info-block-detail"><span class="label">{{ info.label }}:</span><span class="value">{{ info.value }}</span></div>`
    });

    function contentId(dataLayer) {
        if(dataLayer.get("page.pageType") == "index") {
            return (dataLayer.get("page.mediaPageType") || "index")+" "+dataLayer.get("page.content.bcn.pageId");
        } else if(dataLayer.get("page.pageType") != "index") {
            return dataLayer.get("page.content.bcn.pageId");
        }
        return "No ID"
    }

    function isCampaignDataLayer(dataLayer) {
        return (dataLayer.get("page.content.bcn.csid") !== undefined) && (dataLayer.get("page.content.bcn.csid") != "")
    }

    function metaInformation(dataLayer, posts) {
        posts.push({
            title: "Meta Info",
            info: [
                { label: "ID", value: contentId(dataLayer) },
                { label: "Main Topic", value: dataLayer.get("page.topic.mainFormatted") || "not set" },
                { label: "Page Type", value: dataLayer.get("page.pageType") || "not set" },
                { label: "Article Type", value: dataLayer.get("page.articleTypeFormatted") || "not set" },
                { label: "Num. Sections", value: dataLayer.get("page.articleLength.section") || "not set" },
                ]});
    }

    function bcnInformation(dataLayer, posts) {
        posts.push({
            title: "BCN Info",
            info: [
                { label: "CS ID", value: dataLayer.get("page.content.bcn.csid") || "not set" },
                { label: "Exclusive", value: dataLayer.get("page.content.bcn.campaignIsExclusive") ? "yes" : "no" },
                { label: "Content Type", value: dataLayer.get("page.content.bcn.contentType") || "not set" },
                { label: "Theme Cluster", value: dataLayer.get("page.content.bcn.themeCluster") || "not set" },
                { label: "Topics", value: dataLayer.get("page.content.bcn.topics") || "not set" },
                ]});
    }

    function helpInformation(posts) {
        posts.push({
            title: "Help",
            info: [
                { label: "Copy article ID", value: "Just click the number underneath the monkey" },
                { label: "What's the deal with the crown & sunglasses?", value: "If the monkey is shown wearing a crown and sunglasses, a cs-id is set on the page" },
                ]});
    }

    function onPageformation(dataLayer, posts) {
        //wordlink counter
        let wordlinkCount = document.getElementsByClassName("wlm-link").length;
        //ad slots desktop counter
        let adSlotsDesktopCount = document.getElementsByClassName("content-ad").length;
        //ad slots mobile counter
        let adSlotsMobileCount = document.querySelectorAll("bcn-ad[slot='mobile']").length;
        //ad slots cms desktop counter
        let adSlotsDesktopCMSCount = document.getElementsByClassName("plugin-ad-container").length;
        //image gallery counter
        let imageGalleryCount = document.getElementsByClassName("image-gallery-block").length;
        //video counter
        let videoCount = document.getElementsByClassName("video with-description").length;
        //sc teaser counter
        let scTeaserCount = document.getElementsByClassName("ndpm-contentteaser-sc-container").length;
        //lvc teaser counter
        let lvcTeaserCount = document.getElementsByClassName("ndpm-contentteaser-lwc-container").length;
        //hpf teaser counter
        let hpfTeaserCount = document.getElementsByClassName("ndpm-contentteaser-hpf-container").length;
        //hpf teaser counter
        let ndtoolsTeaserCount = document.getElementsByClassName("ndpm-ndtools-wrapper").length;
        //qt/lvc counter
        let qtAndLvcCount = document.getElementsByClassName("block-tool-config quick-test").length;

        posts.push({
            title: "OnPage Info",
            info: [
                { label: "Wordlinks", value: ""+wordlinkCount },
                { label: "Ad Slots Desktop", value: ""+adSlotsDesktopCount },
                { label: "Ad Slots Mobile (Index & Article)", value: ""+adSlotsMobileCount },
                { label: "Ad Slots Desktop (Index)", value: ""+adSlotsDesktopCMSCount },
                { label: "Image Gallery", value: ""+imageGalleryCount },
                { label: "Video", value: ""+videoCount },
                { label: "QT & LVC", value: ""+qtAndLvcCount },
                { label: "SC Teaser", value: ""+scTeaserCount },
                { label: "LVC Teaser", value: ""+lvcTeaserCount },
                { label: "HPF Teaser", value: ""+hpfTeaserCount },
                { label: "nD Tools Teaser", value: ""+ndtoolsTeaserCount },
                ]});
    }

    window.vueMonkey = {
        isReady(successCallBack) {
            jq(document).ready(function(){
                successCallBack();
            });
        },
        appendToBody() {
            jq('body').append(appTemplate);
        },
        startApp() {
            this.appendToBody();
            setTimeout(() => {
                vueMonkeyApp.$mount('#vue-monkey-app');
            }, 1000);
        }
    };
})(window);

window.jq = $.noConflict(true);

(function () {
    'use strict';
    vueMonkey.isReady(function () {
        vueMonkey.startApp();
    });
})();
