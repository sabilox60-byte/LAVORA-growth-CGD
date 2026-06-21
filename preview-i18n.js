(() => {
  const locales = window.CGD_PREVIEW_LOCALES;

  if (!locales || !locales.en || !locales.ar) {
    return;
  }

  const STORAGE_KEY = "cgd-preview-language";
  const VALID_LANGS = new Set(["en", "ar"]);
  const state = { lang: "en" };

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const setText = (node, value) => {
    if (node && typeof value === "string") node.textContent = value;
  };
  const setAttr = (node, name, value) => {
    if (node && typeof value === "string") node.setAttribute(name, value);
  };
  const setTrailingText = (node, value) => {
    if (!node || typeof value !== "string") return;
    const textNode = Array.from(node.childNodes).find((child) => child.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.textContent = value;
    } else {
      node.appendChild(document.createTextNode(value));
    }
  };
  const interpolate = (template, vars = {}) =>
    String(template).replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));

  function saveLanguage(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }

  function getSavedLanguage() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function getUrlLanguage() {
    const lang = new URLSearchParams(window.location.search).get("lang");
    return VALID_LANGS.has(lang) ? lang : null;
  }

  function resolveLanguage() {
    return getUrlLanguage() || getSavedLanguage() || "en";
  }

  function updateUrl(lang, replace = false) {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", lang);
    const next = `${url.pathname}${url.search}${url.hash}`;
    if (replace) {
      history.replaceState({ lang }, "", next);
    } else {
      history.pushState({ lang }, "", next);
    }
  }

  function renderSwitcher(locale) {
    const mount = qs(".preview-language-switch");
    if (!mount) return;

    mount.innerHTML = "";

    const group = document.createElement("div");
    group.className = "preview-language-switcher";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", locale.meta.switcherAria);

    ["en", "ar"].forEach((code) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `preview-language-btn${state.lang === code ? " active" : ""}`;
      button.textContent = locale.meta.switcher[code];
      button.setAttribute("aria-pressed", String(state.lang === code));
      button.setAttribute("data-lang", code);
      button.addEventListener("click", () => {
        if (code === state.lang) return;
        const scrollY = window.scrollY;
        applyLanguage(code, { updateHistory: true, replaceHistory: false, persist: true });
        requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: "auto" }));
      });
      group.appendChild(button);
    });

    mount.appendChild(group);
  }

  function applyGlobal(locale) {
    document.documentElement.lang = locale.meta.lang;
    document.documentElement.dir = locale.meta.dir;
    document.documentElement.classList.toggle("preview-ar", state.lang === "ar");
    document.body.setAttribute("data-preview-lang", state.lang);

    const brand = qs(".brand");
    const brandImg = qs(".brand img");
    setAttr(brand, "aria-label", locale.global.brandAria);
    setAttr(brandImg, "alt", locale.global.brandAlt);
    setText(qs(".header-badge"), locale.global.headerBadge);

    const footerSpans = qsa("footer .footer-row span");
    setText(footerSpans[0], locale.global.footerLeft);
    setText(footerSpans[1], locale.global.footerRight);

    qsa(".clinic-logo, .competitor-logo-v8").forEach((node) => setText(node, locale.global.logoPlaceholder));
  }

  function applyHero(locale) {
    const root = qs("section.hero");
    if (!root) return;
    const globals = locales[state.lang].global;

    setText(qs(".kicker", root), locale.kicker);

    const identity = qs(".clinic-identity-v7", root);
    if (identity) {
      setText(qs("span", identity), locale.prepared);
      const identityName = qs("strong", identity);
      if (identityName && identityName.textContent.trim() === "[CLINIC_NAME]") {
        setText(identityName, globals.clinicNamePlaceholder);
      }
      setText(qs("small", identity), locale.identityLine);
    }

    const titleLines = qsa(".hero-title-v8 > span", root);
    locale.titleLines.forEach((line, index) => setText(titleLines[index], line));
    setText(qs(".hero-position-statement", root), locale.quote);
    setText(qs(".hero-copy-v7 > .lead", root), locale.lead);

    const investment = qs(".hero-investment-line", root);
    if (investment) {
      setText(qs("span", investment), locale.investment.eyebrow);
      setText(qs("strong", investment), locale.investment.title);
      setText(qs("small", investment), locale.investment.body);
    }

    const slot = qs(".personalized-clinic-slot-v8", root);
    setAttr(slot, "aria-label", locale.slot.aria);
    const slotLabel = qs(".clinic-slot-label", root);
    if (slotLabel) {
      setText(qs("span", slotLabel), locale.slot.label);
      const slotClinic = qs("strong", slotLabel);
      if (slotClinic && slotClinic.textContent.trim() === "[CLINIC_NAME]") {
        setText(slotClinic, globals.clinicNamePlaceholder);
      }
      setText(qs("small", slotLabel), locale.slot.note);
    }
    const slotCity = qs(".clinic-slot-location", root);
    if (slotCity && slotCity.textContent.trim() === "[CITY]") {
      setText(slotCity, globals.cityPlaceholder);
    }

    const panel = qs(".hero-decision-panel-clean", root);
    setAttr(panel, "aria-label", locale.decisionPanel.aria);
    const message = qs(".hero-decision-message", root);
    if (message) {
      setText(qs(".decision-hook-v8 span", message), locale.decisionPanel.hook);
      const messageChildren = Array.from(message.children);
      setText(messageChildren[1], locale.decisionPanel.eyebrow);
      setText(messageChildren[2], locale.decisionPanel.title);
    }

    const liveSignal = qs(".decision-live-signal-v8", root);
    if (liveSignal) {
      setText(qs("b", liveSignal), locale.decisionPanel.signalTitle);
      setText(qs("small", liveSignal), locale.decisionPanel.signalBody);
    }

    qsa(".hero-flow-node", root).forEach((node, index) => {
      const item = locale.decisionPanel.flow[index];
      if (!item) return;
      setText(qs("span", node), item[0]);
      setText(qs("small", node), item[1]);
    });

    const outcome = qs(".hero-decision-outcome", root);
    if (outcome) {
      setText(qs("span", outcome), locale.decisionPanel.outcomeEyebrow);
      setText(qs("strong", outcome), locale.decisionPanel.outcomeTitle);
    }
  }

  function applyExecutive(locale) {
    const root = qs(".executive-strip");
    if (!root) return;
    setText(qs(".kicker", root), locale.kicker);
    setText(qs("h2", root), locale.title);
    const intro = qs(".truths-intro-v8", root);
    if (intro) {
      setText(qs("span", intro), locale.introTop);
      setText(qs("b", intro), locale.introBottom);
    }
    qsa(".truth p", root).forEach((node, index) => setText(node, locale.truths[index]));
  }

  function applyChapter(locale) {
    const root = qs(".chapter-band");
    if (!root) return;
    setAttr(root, "aria-label", locale.aria);
    setText(qs("strong", root), locale.title);
    setText(qs("p", root), locale.body);
  }

  function applyDecisionRoom(locale) {
    const root = qs("#decision-room");
    if (!root) return;

    setText(qs(".kicker", root), locale.kicker);
    setText(qs("h2", root), locale.title);
    setText(qs(".grid-2 .lead", root), locale.lead);

    const instruction = qs(".decision-instruction-v8", root);
    if (instruction) {
      setText(qs("span", instruction), locale.instructionTop);
      setText(qs("b", instruction), locale.instructionBottom);
    }

    setAttr(qs(".decision-path-v7", root), "aria-label", locale.aria);

    qsa(".decision-tab", root).forEach((button, index) => {
      const tab = locale.tabs[index];
      if (!tab) return;
      setAttr(button, "aria-label", tab.aria);
      const content = qs("div", button);
      if (content) {
        setText(qs("b", content), tab.title);
        setText(qs("small", content), tab.body);
      }
    });

    setText(qs(".decision-screen-step small", root), locale.stepLabel);

    if (typeof decisionData !== "undefined") {
      Object.entries(locale.states).forEach(([key, value]) => {
        if (decisionData[key]) {
          decisionData[key].eyebrow = value.eyebrow;
          decisionData[key].title = value.title;
          decisionData[key].metrics = value.metrics;
          decisionData[key].loss = value.loss;
        }
      });
    }

    const activeKey = qs(".decision-tab.active", root)?.dataset.decision || locale.tabs[0].key;
    if (typeof renderDecision === "function") {
      renderDecision(activeKey);
    }
  }

  function applyCompetitor(locale) {
    const root = qs("#competitor-pressure");
    if (!root) return;
    const globals = locales[state.lang].global;

    setText(qs(".kicker", root), locale.kicker);
    setText(qs("h2", root), locale.title);
    setText(qs(".grid-2 .lead", root), locale.lead);
    const meta = qs(".radar-meta-v8", root);
    if (meta) {
      setText(qs("span", meta), locale.meta);
      const city = qs("strong", meta);
      if (city && city.textContent.trim() === "[CITY]") {
        setText(city, globals.cityPlaceholder);
      }
    }
    const targetClinic = qs(".target-clinic", root);
    if (targetClinic) {
      const targetSmalls = qsa("small", targetClinic);
      setText(targetSmalls[0], locale.targetLabel);
      if (targetSmalls[1] && targetSmalls[1].textContent.trim() === "[CITY]") {
        setText(targetSmalls[1], globals.cityPlaceholder);
      }
      const clinicName = qs("b", targetClinic);
      if (clinicName && clinicName.textContent.trim() === "[CLINIC_NAME]") {
        setText(clinicName, globals.clinicNamePlaceholder);
      }
    }

    qsa(".competitor", root).forEach((node, index) => {
      const item = locale.competitors[index];
      if (!item) return;
      const title = qs("b", node);
      const placeholder = locale.placeholders?.[index];
      if (title && title.textContent.includes("[Competitor")) {
        setText(title, placeholder || title.textContent);
      }
      const small = qsa("small", node)[0];
      setText(small, item);
    });
  }

  function applyLens(locale) {
    const root = qs("#opportunity-lens");
    if (!root) return;

    setText(qs(".kicker", root), locale.kicker);
    setText(qs("h2", root), locale.title);
    setText(qs(".grid-2 .lead", root), locale.lead);

    const nav = qs(".lens-navigation-v7", root);
    setAttr(nav, "aria-label", locale.aria);
    const heading = qs(".lens-nav-heading", root);
    if (heading) {
      setText(qs("span", heading), locale.navEyebrow);
      setText(qs("strong", heading), locale.navTitle);
      setText(qs("small", heading), locale.navGuide);
    }

    qsa(".lens-option", root).forEach((button, index) => {
      const item = locale.options[index];
      if (!item) return;
      setAttr(button, "aria-label", item.aria);
      setText(qs("span", button), item.title);
      setText(qs("small", button), item.body);
    });

    const live = qs(".lens-live-status-v8", root);
    if (live) {
      setText(qs("b", live), locale.liveTitle);
      setText(qs("small", live), locale.liveBody);
    }

    setText(qs(".lens-dossier-mark", root), locale.mark);
    const logic = qsa(".lens-logic-v7 > span", root);
    locale.logic.forEach((item, index) => setText(logic[index], item));

    qsa("#lensEvidence > div", root).forEach((node, index) => {
      const item = locale.evidence[index];
      if (!item) return;
      setText(qs("b", node), item[0]);
      setText(qs("span", node), item[1]);
    });

    if (typeof lensData !== "undefined") {
      Object.entries(locale.states).forEach(([key, value]) => {
        if (lensData[key]) {
          lensData[key].e = value.e;
          lensData[key].t = value.t;
          lensData[key].b = value.b;
        }
      });
    }

    const activeKey = qs(".lens-option.active", root)?.dataset.lens || locale.options[0].key;
    const selectedLabel = qs(".lens-selection-status", root);
    if (selectedLabel) {
      selectedLabel.childNodes[0].textContent = `${locale.primaryPrefix}`;
    }
    if (typeof renderLens === "function") {
      if (!window.__cgdBaseRenderLens) {
        window.__cgdBaseRenderLens = renderLens;
        renderLens = (key) => {
          window.__cgdBaseRenderLens(key);
          const selected = window.__cgdActiveLocale?.lens.options.find((option) => option.key === key);
          if (selected) {
            setText(qs("#lensSelectedLabel", root), selected.title);
          }
        };
      }
      renderLens(activeKey);
    }
  }

  function applyCapacity(locale) {
    const root = qs("#capacity-model");
    if (!root) return;

    setText(qs(".kicker", root), locale.kicker);
    setText(qs("h2", root), locale.title);
    setText(qs(".grid-2 .lead", root), locale.lead);
    setAttr(qs(".capacity-media img", root), "alt", locale.alt);

    const mediaCaption = qs(".capacity-media .media-caption-panel-clean", root);
    if (mediaCaption) {
      setText(qs(".eyebrow", mediaCaption), locale.mediaEyebrow);
      setText(qs("h3", mediaCaption), locale.mediaTitle);
    }

    const glance = qs(".capacity-glance-label-v8", root);
    if (glance) {
      setText(qs("span", glance), locale.compareEyebrow);
      setText(qs("b", glance), locale.compareTitle);
    }

    qsa(".capacity-card", root).forEach((card, index) => {
      const item = locale.cards[index];
      if (!item) return;
      setText(qs(".eyebrow", card), item.eyebrow);
      setText(qs("strong", card), item.percent);
      qsa("dl > div", card).forEach((row, rowIndex) => {
        const data = item.rows[rowIndex];
        if (!data) return;
        setText(qs("dt", row), data[0]);
        setText(qs("dd", row), data[1]);
      });
    });

    const readiness = qs(".branch-readiness", root);
    if (readiness) {
      setText(qs(".eyebrow", readiness), locale.readinessEyebrow);
      setText(qs("h3", readiness), locale.readinessTitle);
      qsa(".branch-flow span", readiness).forEach((node, index) => setText(node, locale.readinessChips[index]));
      setText(qs(".micro", readiness), locale.disclaimer);
    }
  }

  function applyYearRound(locale) {
    const root = qs("#year-round-demand");
    if (!root) return;

    setAttr(root, "dir", locale.dir || "ltr");
    setText(qs(".kicker", root), locale.kicker);
    setText(qs("h2", root), locale.title);
    setText(qs(".grid-2 .lead", root), locale.lead);

    qsa(".rhythm-chip-v8", root).forEach((chip, index) => {
      const item = locale.moments[index];
      if (!item) return;
      const title = Array.isArray(item) ? item[0] : item;
      const note = Array.isArray(item) ? item[1] : "";
      setText(qs("b", chip), title);
      setText(qs("small", chip), note);
    });

    const chart = qs(".rhythm-wave-v8", root);
    setAttr(chart, "aria-label", locale.chartAria);
    setAttr(qs(".rhythm-wave-v8 svg", root), "aria-label", locale.chartSvgAria);
    const chartHead = qs(".rhythm-wave-head", root);
    if (chartHead) {
      setText(qs("span", chartHead), locale.chartEyebrow);
      setText(qs("b", chartHead), locale.chartTitle);
    }
  }

  function applyDoctorAuthority(locale) {
    const root = qs("#doctor-authority");
    if (!root) return;

    setAttr(qs(".authority-image img", root), "alt", locale.alt);
    setText(qs(".kicker", root), locale.kicker);
    setText(qs("h2", root), locale.title);
    setText(qs(".lead", root), locale.lead);
    qsa(".trust-step", root).forEach((step, index) => {
      const item = locale.steps[index];
      if (!item) return;
      setText(qs("strong", step), item[0]);
      setText(qs("small", step), item[1]);
    });
    setText(qs(".local-note", root), locale.note);
  }

  function applyPremiumDemand(locale) {
    const root = qs("#premium-demand") || qs("#year-round-demand");
    if (!root) return;

    const intro = root.id === "premium-demand" ? root : qs(".v9-demand-intro", root);
    if (intro) {
      setText(qs(".kicker", intro), locale.kicker);
      setText(qs("h2", intro), locale.title);
      setText(qs(".lead", intro), locale.lead);
    }

    qsa(".demand-card", root).forEach((card, index) => {
      const item = locale.cards[index];
      if (!item) return;
      setAttr(qs("img", card), "alt", locale.alts[index]);
      setText(qs(".eyebrow", card), item[0]);
      setText(qs("h3", card), item[1]);
      setText(qs("p", card), item[2]);
      setText(qs(".card-open-cue-v8", card), item[3]);
    });
  }

  function applyCalculator(locale) {
    const root = qs("#calculator");
    if (!root) return;

    setText(qs(".kicker", root), locale.kicker);
    setText(qs("h2", root), locale.title);
    setText(qs(".grid-2 .lead", root), locale.lead);

    qsa(".currency", root).forEach((button, index) => {
      const label = locale.currencies[index];
      setText(button, label);
      setAttr(button, "aria-label", label);
    });

    qsa(".calc-control label", root).forEach((label, index) => setText(label, locale.labels[index]));
    qsa(".calc-results .result span", root).forEach((label, index) => setText(label, locale.labels[index + 3]));

    const activeCurrency = qs(".currency.active", root)?.dataset.currency || "USD";
    if (typeof setCurrency === "function") setCurrency(activeCurrency);
  }

  function ensureCostLocaleHook() {
    if (window.__cgdCostLocaleHooked || typeof updateCostLens !== "function") {
      return;
    }

    const original = updateCostLens;
    updateCostLens = function patchedUpdateCostLens(monthly) {
      original(monthly);
      const locale = window.__cgdActiveLocale?.cost;
      if (!locale) return;
      const months = typeof delayMonths !== "undefined" ? delayMonths : 3;
      setText(qs(".cost-hero > span"), locale.ledgerIntroTop);
      setText(qs("#delayPeriodLabel"), interpolate(locale.periodLabel, { months }));
      const ledgerArticles = qsa(".cost-ledger article");
      if (ledgerArticles[1]) setText(qs("strong", ledgerArticles[1]), locale.fixedValue);
      if (ledgerArticles[2] && typeof DELAY_CURVE !== "undefined" && DELAY_CURVE[months]) {
        setText(qs("strong", ledgerArticles[2]), DELAY_CURVE[months].authority);
      }
      if (ledgerArticles[3] && typeof DELAY_CURVE !== "undefined" && DELAY_CURVE[months]) {
        setText(qs("strong", ledgerArticles[3]), DELAY_CURVE[months].cycles);
      }
    };

    window.__cgdCostLocaleHooked = true;
  }

  function applyCost(locale) {
    const root = qs("#cost-of-inaction");
    if (!root) return;

    setText(qs(".kicker", root), locale.kicker);
    setText(qs("h2", root), locale.title);
    setText(qs(".cost-heading .lead", root), locale.lead);

    setAttr(qs(".delay-selector", root), "aria-label", locale.selectorAria);
    qsa(".delay-btn", root).forEach((button, index) => {
      const item = locale.buttons[index];
      if (!item) return;
      setAttr(button, "aria-label", item[2]);
      setText(qs("b", button), item[0]);
      setText(qs("span", button), item[1]);
    });

    setAttr(qs(".cost-curve-v7", root), "aria-label", locale.curveAria);
    setAttr(qs(".cost-curve-v7 svg", root), "aria-label", locale.curveSvgAria);

    const curveHeading = qs(".cost-curve-heading", root);
    if (curveHeading) {
      setText(qs("span", curveHeading), locale.curveTitle);
      setText(qs("small", curveHeading), locale.curveBody);
    }

    qsa(".cost-curve-labels span", root).forEach((node, index) => {
      setText(qs("small", node), locale.curveLabels[index]);
    });

    setText(qs(".cost-hero > span", root), locale.ledgerIntroTop);
    setText(qs("#delayPeriodLabel", root), locale.ledgerIntroBottom);
    qsa(".cost-ledger article", root).forEach((article, index) => {
      const item = locale.ledger[index];
      if (!item) return;
      setText(qs("span", article), item[0]);
      setText(qs("p", article), item[1]);
    });
    const ledgerArticles = qsa(".cost-ledger article", root);
    if (ledgerArticles[1]) setText(qs("strong", ledgerArticles[1]), locale.fixedValue);
    setText(qs(".cost-disclaimer", root), locale.disclaimer);

    if (typeof DELAY_CURVE !== "undefined") {
      Object.entries(locale.delayCurves).forEach(([key, value]) => {
        if (DELAY_CURVE[key]) {
          DELAY_CURVE[key].authority = value.authority;
          DELAY_CURVE[key].cycles = value.cycles;
        }
      });
    }

    ensureCostLocaleHook();
    if (typeof updateCalc === "function") updateCalc();
  }

  function applyGrowthSystem(locale) {
    const root = qs("#growth-system");
    if (!root) return;

    setText(qs(".kicker", root), locale.kicker);
    setText(qs("h2", root), locale.title);
    setText(qs(".grid-2 .lead", root), locale.lead);

    const guide = qs(".system-map-guide-v8", root);
    if (guide) {
      setText(qs("span", guide), locale.guideTop);
      setText(qs("b", guide), locale.guideBottom);
    }

    const demand = qsa(".operating-engine-v7", root)[0];
    if (demand) {
      setTrailingText(qs(".engine-status-v8", demand), locale.demand.status);
      const heading = qs(".engine-heading-v7", demand);
      if (heading) {
        setText(qs("span", heading), locale.demand.number);
        setText(qs("h3", heading), locale.demand.title);
        setText(qs("small", heading), locale.demand.body);
      }
      qsa(".engine-capabilities-v7 span", demand).forEach((node, index) => setText(node, locale.demand.capabilities[index]));
    }

    const core = qs(".core-content-v7", root);
    if (core) {
      setText(qs("span", core), locale.core.eyebrow);
      setText(qs("b", core), locale.core.title);
      qsa(".core-cycle span", core).forEach((node, index) => setText(node, locale.core.cycle[index]));
    }

    const patient = qsa(".operating-engine-v7", root)[1];
    if (patient) {
      setTrailingText(qs(".engine-status-v8", patient), locale.patient.status);
      const heading = qs(".engine-heading-v7", patient);
      if (heading) {
        setText(qs("span", heading), locale.patient.number);
        setText(qs("h3", heading), locale.patient.title);
        setText(qs("small", heading), locale.patient.body);
      }
      qsa(".engine-capabilities-v7 span", patient).forEach((node, index) => setText(node, locale.patient.capabilities[index]));
    }

    qsa(".operating-feedback-v7 > span:not(.feedback-flow-line-v8)", root).forEach((node, index) =>
      setText(node, locale.feedback[index])
    );
    setText(qs(".system-thesis", root), locale.thesis);
  }

  function applyPatientValue(locale) {
    const root = qs("#patient-value");
    if (!root) return;

    setText(qs(".kicker", root), locale.kicker);
    setText(qs("h2", root), locale.title);
    setText(qs(".grid-2 .lead", root), locale.lead);

    qsa(".future-grid article", root).forEach((card, index) => {
      const item = locale.cards[index];
      if (!item) return;
      setText(qs(".eyebrow", card), item.eyebrow);
      setText(qs("h3", card), item.title);
      qsa(".future-step", card).forEach((node, stepIndex) => setText(node, item.steps[stepIndex]));
      setText(qs(".micro", card), item.body);
    });
  }

  function applyCommandCenter(locale) {
    const root = qs("#command-center");
    if (!root) return;

    setText(qs(".kicker", root), locale.kicker);
    setText(qs("h2", root), locale.title);
    setText(qs(".lead", root), locale.lead);
    qsa(".decision-loop div", root).forEach((node, index) => setText(node, locale.loop[index]));
    setText(qs(".command-panel .eyebrow", root), locale.eyebrow);
    qsa(".signal", root).forEach((node, index) => {
      const item = locale.signals[index];
      if (!item) return;
      setText(qs("span", node), item[0]);
      setText(qs("b", node), item[1]);
    });
    setText(qs(".command-panel .micro", root), locale.disclaimer);
  }

  function applyTeam(locale) {
    const root = qs("#powered-team");
    if (!root) return;

    setText(qs(".kicker", root), locale.kicker);
    setText(qs("h2", root), locale.title);
    setText(qs(".grid-2 .lead", root), locale.lead);
    setText(qs(".editorial-media-label", root), locale.editorialLabel);
    setAttr(qs(".team-stage img", root), "alt", locale.alt);

    const copy = qs(".team-copy", root);
    if (copy) {
      setText(qs(".eyebrow", copy), locale.eyebrow);
      setText(qs("h3", copy), locale.heading);
      setText(qs("p", copy), locale.body);
      qsa(".role-cloud span", copy).forEach((node, index) => setText(node, locale.roles[index]));
    }
  }

  function updateFitResult(locale) {
    const activeCount = qsa(".fit-btn.active", qs("#fit")).length;
    setText(qs("#fitResult"), locale.results[String(activeCount)]);
  }

  function attachFitLocaleHandler() {
    if (window.__cgdFitLocaleHooked) return;
    const container = qs("#fit .fit-buttons");
    if (!container) return;
    container.addEventListener("click", () => {
      requestAnimationFrame(() => updateFitResult(window.__cgdActiveLocale.fit));
    });
    window.__cgdFitLocaleHooked = true;
  }

  function applyFit(locale) {
    const root = qs("#fit");
    if (!root) return;

    setText(qs(".kicker", root), locale.kicker);
    setText(qs("h2", root), locale.title);
    setText(qs(".grid-2 .lead", root), locale.lead);

    const cards = qsa(".responsibility-card", root);
    const left = cards[0];
    const right = cards[1];
    if (left) {
      setText(qs(".eyebrow", left), locale.left.eyebrow);
      setText(qs("h3", left), locale.left.title);
      qsa("li", left).forEach((node, index) => setText(node, locale.left.items[index]));
    }
    if (right) {
      setText(qs(".eyebrow", right), locale.right.eyebrow);
      setText(qs("h3", right), locale.right.title);
      qsa("li", right).forEach((node, index) => setText(node, locale.right.items[index]));
    }

    const fitCheck = qs(".fit-check", root);
    if (fitCheck) {
      setText(qs(".eyebrow", fitCheck), locale.checkEyebrow);
      setText(qs("h3", fitCheck), locale.checkTitle);
      qsa(".fit-btn", fitCheck).forEach((node, index) => {
        setText(node, locale.buttons[index]);
        setAttr(node, "aria-label", locale.buttons[index]);
      });
    }

    attachFitLocaleHandler();
    updateFitResult(locale);
  }

  function applyValueArchitecture(locale) {
    const root = qs("#value-architecture");
    if (!root) return;

    setText(qs(".kicker", root), locale.kicker);
    setText(qs("h2", root), locale.title);
    setText(qs(".value-intro .lead", root), locale.lead);

    qsa(".value-layer-v7", root).forEach((layer, index) => {
      const item = locale.layers[index];
      if (!item) return;
      const label = qs(".value-layer-label-v7", layer);
      if (label) {
        setText(qs("span", label), item.title);
        setText(qs("small", label), item.subtitle);
      }
      qsa(".value-asset-v7", layer).forEach((asset, assetIndex) => {
        const data = item.assets[assetIndex];
        if (!data) return;
        setText(qs("strong", asset), data[0]);
        setText(qs("p", asset), data[1]);
      });
      const outcome = qs(".value-outcome-v7", layer);
      if (outcome) {
        setText(qs("span", outcome), locale.outcomePrefix);
        setText(qs("strong", outcome), item.outcome);
      }
    });

    qsa(".value-conclusion > div", root).forEach((block, index) => {
      const item = locale.conclusion[index];
      if (!item) return;
      setText(qs("span", block), item[0]);
      setText(qs("strong", block), item[1]);
    });
  }

  function applyPartnership(locale) {
    const root = qs("#selective-partnership");
    if (!root) return;

    setText(qs(".kicker", root), locale.kicker);
    setText(qs("h2", root), locale.title);
    qsa(".partnership-review-grid .lead", root).forEach((node, index) => setText(node, locale.body[index]));
    setAttr(qs(".partnership-proof-grid", root), "aria-label", locale.proofAria);
    qsa(".partnership-proof-grid span", root).forEach((node, index) => setText(node, locale.proofs[index]));
    setText(qs(".partnership-closing", root), locale.closing);
    setText(qs(".cta-row .cta", root), locale.cta);
  }

  function applyMobilisation(locale) {
    const root = qs("#mobilisation");
    if (!root) return;

    setText(qs(".kicker", root), locale.kicker);
    setText(qs("h2", root), locale.title);
    setText(qs(".grid-2 .lead", root), locale.lead);
    qsa(".timeline > div", root).forEach((node, index) => setText(qs("span", node), locale.timeline[index]));
    qsa(".tag-list span", root).forEach((node, index) => setText(node, locale.tags[index]));
    setAttr(qs(".mobil-image img", root), "alt", locale.alt);
    const caption = qs(".mobil-caption-clean", root);
    if (caption) {
      setText(qs(".eyebrow", caption), locale.captionEyebrow);
      setText(qs("h3", caption), locale.captionTitle);
    }
  }

  function applyLeadership(locale) {
    const root = qs("#leadership-decision");
    if (!root) return;

    setText(qs(".kicker", root), locale.kicker);
    setText(qs("h2", root), locale.title);
    setText(qs(".lead", root), locale.lead);
    qsa(".next-step-flow > div", root).forEach((node, index) => setText(qs("span", node), locale.steps[index]));
    const ctas = qsa(".cta-row .cta", root);
    setText(ctas[0], locale.primaryCta);
    setText(ctas[1], locale.secondaryCta);
    setText(qs(".cta-assurance", root), locale.assurance);
  }

  function applyLocale(lang) {
    const locale = locales[lang] || locales.en;
    state.lang = lang;
    window.__cgdActiveLocale = locale;

    renderSwitcher(locale);
    applyGlobal(locale);
    applyHero(locale.hero);
    applyExecutive(locale.executive);
    applyChapter(locale.chapter);
    applyDecisionRoom(locale.decisionRoom);
    applyCompetitor(locale.competitor);
    applyLens(locale.lens);
    applyCapacity(locale.capacity);
    applyYearRound(locale.yearRound);
    applyDoctorAuthority(locale.doctorAuthority);
    applyPremiumDemand(locale.premiumDemand);
    applyCalculator(locale.calculator);
    applyCost(locale.cost);
    applyGrowthSystem(locale.growthSystem);
    applyPatientValue(locale.patientValue);
    applyCommandCenter(locale.commandCenter);
    applyTeam(locale.team);
    applyFit(locale.fit);
    applyValueArchitecture(locale.valueArchitecture);
    applyPartnership(locale.partnership);
    applyMobilisation(locale.mobilisation);
    applyLeadership(locale.leadership);
  }

  function applyLanguage(lang, options = {}) {
    const nextLang = VALID_LANGS.has(lang) ? lang : "en";
    const { updateHistory = false, replaceHistory = false, persist = true } = options;

    applyLocale(nextLang);

    if (persist) saveLanguage(nextLang);
    if (updateHistory) {
      updateUrl(nextLang, replaceHistory);
    }
  }

  window.addEventListener("popstate", () => {
    applyLanguage(resolveLanguage(), { updateHistory: false, persist: false });
  });

  applyLanguage(resolveLanguage(), {
    updateHistory: true,
    replaceHistory: !getUrlLanguage(),
    persist: true
  });
})();
