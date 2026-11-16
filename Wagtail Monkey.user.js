// ==UserScript==
// @name        Wagtail Monkey
// @namespace   ND
// @author      netDoktor
// @include     /^https?:\/\/www\.netdoktor\.de\//
// @include     /^https?:\/\/www\.netdoktor\.at\//
// @include     /^https?:\/\/www\.netdoktor\.ch\//
// @include     /^https?:\/\/rezepte\.netdoktor\.at\//
// @include     /^https?:\/\/stage\.tech\.netdoktor\.de\//
// @include     /^https?:\/\/stage\.tech\.netdoktor\.at\//
// @include     /^https?:\/\/stage\.tech\.netdoktor\.ch\//
// @version     5.1.0
// @description Adds a helpful simian companion to netDoktor pages that provides information about various on-page elements.
// @downloadURL https://github.com/Mancomb-Seepgood/tampermonkey_scripts_nd/raw/refs/heads/main/Wagtail%20Monkey.user.js
// @updateURL   https://github.com/Mancomb-Seepgood/tampermonkey_scripts_nd/raw/refs/heads/main/Wagtail%20Monkey.user.js
// @grant       GM_xmlhttpRequest
// @connect     www.gesundheitsportal-privat.de
// @require     https://cdnjs.cloudflare.com/ajax/libs/vue/2.6.14/vue.min.js
// @run-at      document-body
// @noframes
// ==/UserScript==
(function() {
    'use strict';
    const version = '5.1.0';
    const appTemplate = `<style>
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
    width: 75px;
    height: 75px;
    border-radius:50%;
    background-size: 75px 75px;
    display: block;
    pointer-events:auto;
  }
  .vue-monkey .closed-layer .image.standard {
    background-image: url('https://cdn.netdoktor.de/images/internal/IR_Monkey_v2.jpg');
  }
  .vue-monkey .closed-layer .image.campaign {
    background-image: url('https://cdn.netdoktor.de/images/internal/IR_Monkey_Gold_v2.jpg');
  }
  .vue-monkey .closed-layer .id-label {
    pointer-events:auto;
    text-align: center;
    margin-top: 4px;
    width: 75px; height: 20px;
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
    font-size: 14px;
    font-style: italic;
  }
  .vue-monkey .info-block .info-block-detail .value {
    padding-left: 8px;
  }
  .vue-monkey .fixed-block {
    pointer-events:auto;
    padding: 8px 8px 0 20px;
  }
  .vue-monkey .fixed-block .goto-id {
    pointer-events:auto;
  }
  .vue-monkey .fixed-block .form-label {
    font-size: 14px;
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
    <div v-on:click="copyContentId" class="id-label" :style="{ display: labelStyle }"><span class="id-text">{{ message }}</span></div>
    <input type="hidden" id="coptToClipboard" :value="copyString">
  </div>
  <div class="open-layer" :class="[!isClosed ? 'shown' : 'hidden']" v-on:click="toggle">
    <div class="fixed-block">
      <form class="goto-id" @submit.prevent="gotoArticle">
        <span class="form-label">Go to article in Wagtail admin:</span>
        <input
  id="gotoId"
  type="text"
  v-model="articleid"
  placeholder="Enter article ID & confirm"
  @keydown.enter.prevent.stop="gotoArticle"
/>
        <button class="button" title="Datum bei äquivalenter GPP-URL prüfen" type="button" @click.stop="checkGppDate">Check GPP date</button>
        <input type="text" readonly :value="gppDate" style="margin-left:8px; width:140px;" />
      </form>
    </div>
    <div class="fixed-block">
      <span class="form-label">Switch environment:</span><button class="button" title="Zu Stage wechseln" @click="gotoEnv('stage')">Stage</button><button class="button" title="Zu Prod wechseln" @click="gotoEnv('prod')">Prod</button><button class="button" title="Zu gleichem Pfad bei GPP wechseln" @click="gotoEnv('gpp')">GPP</button>
    </div>
    <div class="fixed-block">
      <span class="form-label">Switch locale:</span><button class="button" title="Zu DE wechseln" @click="gotoEnv('nd_de')">DE</button><button class="button" title="Zu AT wechseln" @click="gotoEnv('nd_at')">AT</button><button class="button" title="Zu CH wechseln" @click="gotoEnv('nd_ch')">CH</button>
    </div>
    <info-block
      v-for="(post, index) in posts"
      :key="index"
      :post="post"
    ></info-block>
  </div>
</div>`;

    function readConfig() {
        const element = document.getElementById('nd-config');
        if (!element) {
            console.warn('Wagtail Monkey: #nd-config was not found.');
            return {};
        }
        try {
            return JSON.parse(element.textContent);
        } catch (error) {
            console.error('Wagtail Monkey: could not parse #nd-config.', error);
            return {};
        }
    }

    function firstSet(...values) {
        return values.find(value =>
            value !== undefined &&
            value !== null &&
            value !== '' &&
            value !== 'none'
        );
    }

    function displayValue(value) {
        return value === undefined || value === null || value === '' ?
            'not set' :
            String(value);
    }

    function pageData(config) {
        const analytics = config.analytics || {};
        const dimensions = analytics.customDimensions || {};
        return {
            ads: config.ads || {},
            page: dimensions.page || {}
        };
    }

    function contentId(data) {
        const id = firstSet(data.ads.pageId, data.page.id);
        if (id === undefined) return 'No ID';
        const pageType = firstSet(data.page.contentType, data.page.pageType);
        if (pageType === 'index') {
            const mediaPageType = firstSet(
                data.page.contentMediaType,
                data.page.mediaPageType
            ) || 'index';
            return mediaPageType + ' ' + id;
        }
        return String(id);
    }

    function campaignId(data) {
        return firstSet(data.ads.csid, data.page.csid);
    }

    function metaInformation(data, posts) {
        const page = data.page;
        const sectionCount = [...document.querySelectorAll('section.section.article-grid')]
            .filter(section => [...section.classList].some(className => /^section-\d+$/.test(className))).length;
        posts.push({
            title: 'Meta Info',
            info: [{
                    label: 'ID',
                    value: contentId(data)
                },
                {
                    label: 'Main Topic',
                    value: displayValue(firstSet(page.mainFormatted, page.topic && page.topic.mainFormatted))
                },
                {
                    label: 'Page Type',
                    value: displayValue(firstSet(page.contentType, page.pageType))
                },
                {
                    label: 'Article Type',
                    value: displayValue(firstSet(page.contentMediaType, page.articleTypeFormatted))
                },
                {
                    label: 'Num. Sections',
                    value: String(sectionCount)
                }
            ]
        });
    }

    function adInformation(config, data, posts) {
        const ads = data.ads;
        posts.push({
            title: 'Ad Info',
            info: [{
                    label: 'CS-ID',
                    value: displayValue(campaignId(data))
                },
                {
                    label: 'Exclusive',
                    value: ads.campaignIsExclusive ? 'yes' : 'no'
                },
                {
                    label: 'Campaign Type',
                    value: displayValue(ads.campaignType)
                },
                {
                    label: 'Category',
                    value: displayValue(ads.category)
                },
                {
                    label: 'Subtopic',
                    value: displayValue(ads.subtopic)
                },
                {
                    label: 'Layout',
                    value: displayValue(ads.layout)
                },
                {
                    label: 'Edi-Hub',
                    value: ads.edihub ? 'yes' : 'no'
                },
                {
                    label: 'Ads Disabled?',
                    value: config.ads_disabled ? 'yes' : 'no'
                }
            ]
        });
    }

    function onPageInformation(posts) {
        const count = selector => String(document.querySelectorAll(selector).length);
        const inNumberedSection = heading => {
            const articleContent = heading.closest('div.article-content');
            if (!articleContent) return false;

            for (let parent = heading.parentElement; parent && parent !== articleContent; parent = parent.parentElement) {
                if (
                    parent.tagName === 'SECTION' && [...parent.classList].some(className => /^section-\d+$/.test(className))
                ) {
                    return true;
                }
            }
            return false;
        };
        const isAdditionalH2InNumberedSection = h2 => {
            const articleContent = h2.closest('div.article-content');
            if (!articleContent) return false;

            for (let parent = h2.parentElement; parent && parent !== articleContent; parent = parent.parentElement) {
                if (
                    parent.tagName === 'SECTION' && [...parent.classList].some(className => /^section-\d+$/.test(className))
                ) {
                    return parent.querySelector('h2') !== h2;
                }
            }
            return false;
        };
        posts.push({
            title: 'OnPage Info',
            info: [{
                    label: 'Wordlinks',
                    value: count('.wlm-link')
                },
                {
                    label: 'Ad Slots Desktop',
                    value: count('nd-advertisement.content-ad')
                },
                {
                    label: 'Ad Slots Mobile (incl. Footer & Header)',
                    value: count('nd-ad-slot[slot="mobile"]')
                },
                {
                    label: 'Ad Slots Desktop (Index)',
                    value: count('.plugin-ad-container')
                },
                {
                    label: 'Image Gallery',
                    value: count('.image-gallery-block')
                },
                {
                    label: 'Link Box',
                    value: count('.block-link-box')
                },
                {
                    label: 'Video',
                    value: count('.video.with-description')
                },
                {
                    label: 'Inline Images',
                    value: count('.block-image')
                },
                {
                    label: '3-Question Interviews',
                    value: count('.block-three-questions')
                },
                {
                    label: 'Num. Sources',
                    value: count('#trust-block-content > div.trust-block-section.trust-block-sources > ul > li')
                },
                {
                    label: 'QT & LVC',
                    value: count('.block-tool-config.quick-test')
                },
                {
                    label: 'H2s w/o sections',
                    value: String([...document.querySelectorAll('div.article-content h2')].filter(isAdditionalH2InNumberedSection).length)
                },
                {
                    label: 'Orphaned headlines',
                    value: String([...document.querySelectorAll('div.article-content h2, div.article-content h3, div.article-content h4')].filter(heading => inNumberedSection(heading) && heading.nextElementSibling?.tagName !== 'P').length)
                }


            ]
        });
    }

    function helpInformation(posts) {
        posts.push({
            title: 'Help',
            info: [{
                    label: 'Copy article ID',
                    value: 'Just click the number underneath the monkey'
                },
                {
                    label: "What's the deal with the crown & sunglasses?",
                    value: 'If the monkey is sporting a crown and sunglasses, a CS-ID is set on the page'
                }
            ]
        });
    }

    function startApp() {
        if (!document.body || document.getElementById('vue-monkey-app')) return;
        const config = readConfig();
        const data = pageData(config);
        const posts = [];
        metaInformation(data, posts);
        adInformation(config, data, posts);
        onPageInformation(posts);
        helpInformation(posts);
        posts.push({
            title: 'Wagtail Monkey',
            info: [{
                label: 'Version',
                value: version
            }]
        });
        Vue.component('info-block-label', {
            props: ['info'],
            template: '<div class="info-block-detail"><span class="label">{{ info.label }}:</span><span class="value">{{ info.value }}</span></div>'
        });
        Vue.component('info-block', {
            props: ['post'],
            template: '<div class="info-block"><span class="title">{{ post.title }}</span><info-block-label v-for="(info, index) in post.info" :key="index" :info="info"></info-block-label></div>'
        });
        document.body.insertAdjacentHTML('beforeend', appTemplate);
        new Vue({
            el: '#vue-monkey-app',
            data: {
                message: contentId(data),
                isCampaign: campaignId(data) !== undefined,
                labelStyle: 'block',
                isClosed: true,
                mountDisplay: 'block',
                copyString: '',
                posts: posts,
                articleid: null,
                gppDate: 'not checked'
            },
            methods: {
                toggle: function(event) {
                    // Clicking a control must not close the overlay.
                    if (event.target.closest('button, input, form')) return;
                    this.isClosed = !this.isClosed;
                },
                copyContentId: function() {
                    this.copyString = this.message;
                    const input = document.getElementById('coptToClipboard');
                    input.type = 'text';
                    input.value = this.message;
                    input.select();
                    try {
                        if (!document.execCommand('copy')) {
                            console.warn('Wagtail Monkey: copying the ID was unsuccessful.');
                        }
                    } catch (error) {
                        console.error('Wagtail Monkey: unable to copy the ID.', error);
                    } finally {
                        input.type = 'hidden';
                        const selection = window.getSelection();
                        if (selection) selection.removeAllRanges();
                    }
                },
                gotoArticle: function() {
                    const id = String(this.articleid || '').trim();
                    if (!/^[0-9]+$/.test(id)) return;
                    window.location.href = 'https://admin.netdoktor.de/admin/pages/' + id;
                },
                gotoEnv: function(envName) {
                    const match = window.location.hostname.match(/netdoktor\.(.*?)$/);
                    if (!match) return;
                    const tld = match[1];
                    let envDomain = 'https://www.netdoktor.' + tld;
                    if (envName === 'stage') envDomain = 'https://stage.tech.netdoktor.' + tld;
                    if (envName === 'gpp') envDomain = 'https://www.gesundheitsportal-privat.de';
                    if (envName === 'nd_de') envDomain = 'https://www.netdoktor.de';
                    if (envName === 'nd_at') envDomain = 'https://www.netdoktor.at';
                    if (envName === 'nd_ch') envDomain = 'https://www.netdoktor.ch';
                    window.open(envDomain + window.location.pathname, '_blank');
                },
                checkGppDate: function() {
                    this.gppDate = 'loading...';
                    const gppUrl =
                        'https://www.gesundheitsportal-privat.de' +
                        window.location.pathname;
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: gppUrl,
                        timeout: 15000,
                        onload: response => {
                            if (response.status < 200 || response.status >= 300) {
                                this.gppDate = response.status === 404 ?
                                    'not found' :
                                    'request error';
                                return;
                            }
                            try {
                                const doc = new DOMParser().parseFromString(
                                    response.responseText,
                                    'text/html'
                                );
                                const sections = doc.querySelectorAll(
                                    '#trust-block-content .trust-block-section'
                                );
                                let foundDate = null;
                                sections.forEach(section => {
                                    const label = section.querySelector('.label');
                                    const time = section.querySelector('time');
                                    if (
                                        label &&
                                        time &&
                                        (
                                            label.textContent.trim().startsWith('Datum') ||
                                            label.textContent.trim().startsWith('Aktualisiert am')
                                        )
                                    ) {
                                        foundDate = time.textContent.trim();
                                    }
                                });
                                this.gppDate = foundDate || 'not found';
                            } catch (error) {
                                console.error('Error parsing GPP page:', error);
                                this.gppDate = 'parse error';
                            }
                        },
                        onerror: error => {
                            console.error('Error loading GPP page:', error);
                            this.gppDate = 'request error';
                        },
                        ontimeout: () => {
                            this.gppDate = 'request error';
                        }
                    });
                }
            }
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startApp, {
            once: true
        });
    } else {
        startApp();
    }
})();
