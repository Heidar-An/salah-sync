const APP_CONFIG = {
  googleClientId:
    "699047824906-shorq5v9nj3l6r0qeplqrq0e985ko8do.apps.googleusercontent.com",
  googleScopes: [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar.events",
  ],
  prayerMethods: [
    { id: 1, label: "Muslim World League (MWL)" },
    { id: 2, label: "Islamic Society of North America (ISNA)" },
    { id: 3, label: "Egyptian General Authority of Survey" },
    { id: 4, label: "Umm Al-Qura University, Makkah" },
    { id: 5, label: "University of Islamic Sciences, Karachi" },
  ],
  reminderOptions: [
    { minutes: 5, label: "5 minutes before" },
    { minutes: 10, label: "10 minutes before" },
    { minutes: 15, label: "15 minutes before" },
    { minutes: 20, label: "20 minutes before" },
  ],
  durationOptions: [
    { minutes: 10, label: "10 minutes" },
    { minutes: 15, label: "15 minutes" },
    { minutes: 30, label: "30 minutes" },
  ],
  syncRanges: [
    { id: "next_30_days", label: "Next 30 days" },
    { id: "next_90_days", label: "Next 90 days" },
    { id: "rest_of_year", label: "Rest of this year" },
    { id: "this_year_and_next", label: "This year + next year" },
  ],
  prayers: [
    { id: "fajr", label: "Fajr", enabled: true },
    { id: "sunrise", label: "Sunrise", enabled: true },
    { id: "dhuhr", label: "Dhuhr", enabled: true },
    { id: "asr", label: "Asr", enabled: true },
    { id: "maghrib", label: "Maghrib", enabled: true },
    { id: "isha", label: "Isha", enabled: true },
  ],
};

const DEFAULT_SELECTED_PRAYERS = APP_CONFIG.prayers
  .filter((prayer) => prayer.enabled)
  .map((prayer) => prayer.id);
const DEFAULT_REMINDER_MINUTES = String(
  APP_CONFIG.reminderOptions.find((option) => option.minutes === 10)?.minutes ??
    APP_CONFIG.reminderOptions[0].minutes,
);
const DEFAULT_DURATION_MINUTES = String(
  APP_CONFIG.durationOptions.find((option) => option.minutes === 15)?.minutes ??
    APP_CONFIG.durationOptions[0].minutes,
);
const DEFAULT_SYNC_RANGE_ID = "next_90_days";
const FALLBACK_TIME_ZONES = [
  "UTC",
  "Africa/Cairo",
  "America/Chicago",
  "America/Los_Angeles",
  "America/New_York",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Riyadh",
  "Asia/Singapore",
  "Australia/Sydney",
  "Europe/London",
  "Europe/Paris",
];
const PRAYER_TIMING_KEYS = {
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};
const PRAYER_EVENT_ID_CODES = {
  fajr: "01",
  sunrise: "02",
  dhuhr: "03",
  asr: "04",
  maghrib: "05",
  isha: "06",
};
const PRAYER_EVENT_COLOR_ID = "8";
const PRAYER_EVENT_SOURCE = "prayer-times-app";
const SYNC_BATCH_SIZE = 50;
const SYNC_BATCH_DELAY_MS = 2000;
const SYNC_RATE_LIMIT_BASE_DELAY_MS = 1000;
const SYNC_RATE_LIMIT_MAX_DELAY_MS = 64000;
const SYNC_RATE_LIMIT_MAX_RETRIES = 6;

const browserTimeZone = detectBrowserTimeZone();
const state = {
  currentView: "landing",
  accessToken: "",
  gisLoaded: false,
  authReady: false,
  authBusy: false,
  errorMessage: "",
  browserTimeZone,
  location: createLocationState(browserTimeZone),
  settings: createSettingsState(),
  confirmedSetup: null,
  preparation: createPreparationState(),
  sync: createSyncState(),
};

const elements = {};
let preparationRequestCounter = 0;
const backgroundTimer = createBackgroundTimer();

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  renderStaticOptions();
  render();
  initializeGoogleAuth();
});

function cacheElements() {
  elements.views = [...document.querySelectorAll("[data-view]")];
  elements.signInButton = document.querySelector("#sign-in-button");
  elements.errorMessage = document.querySelector("#error-message");
  elements.calculationMethod = document.querySelector("#calculation-method");
  elements.reminderTiming = document.querySelector("#reminder-timing");
  elements.eventDuration = document.querySelector("#event-duration");
  elements.syncRange = document.querySelector("#sync-range");
  elements.prayerGrid = document.querySelector("#prayer-grid");
  elements.retryAuthButton = document.querySelector("#retry-auth-button");
  elements.backHomeButton = document.querySelector("#back-home-button");
  elements.resetSessionButton = document.querySelector("#reset-session-button");
  elements.settingsForm = document.querySelector("#settings-form");
  elements.useCurrentLocationButton = document.querySelector(
    "#use-current-location-button",
  );
  elements.useManualLocationButton = document.querySelector(
    "#use-manual-location-button",
  );
  elements.retryLocationButton = document.querySelector("#retry-location-button");
  elements.locationModeLabel = document.querySelector("#location-mode-label");
  elements.locationValue = document.querySelector("#location-value");
  elements.locationNote = document.querySelector("#location-note");
  elements.manualLocationFields = document.querySelector("#manual-location-fields");
  elements.cityInput = document.querySelector("#city-input");
  elements.countryInput = document.querySelector("#country-input");
  elements.timezoneSelect = document.querySelector("#timezone-select");
  elements.useBrowserTimezoneButton = document.querySelector(
    "#use-browser-timezone-button",
  );
  elements.confirmSettingsButton = document.querySelector(
    "#confirm-settings-button",
  );
  elements.confirmationPanel = document.querySelector("#confirmation-panel");
  elements.summaryLocation = document.querySelector("#summary-location");
  elements.summaryTimezone = document.querySelector("#summary-timezone");
  elements.summaryMethod = document.querySelector("#summary-method");
  elements.summaryTimes = document.querySelector("#summary-prayers");
  elements.summaryRange = document.querySelector("#summary-range");
  elements.summaryReminder = document.querySelector("#summary-reminder");
  elements.summaryDuration = document.querySelector("#summary-duration");
  elements.preparationPanel = document.querySelector("#preparation-panel");
  elements.preparationStatus = document.querySelector("#preparation-status");
  elements.preparationSummary = document.querySelector("#preparation-summary");
  elements.preparedEventCount = document.querySelector("#prepared-event-count");
  elements.preparedCoverage = document.querySelector("#prepared-coverage");
  elements.preparedSource = document.querySelector("#prepared-source");
  elements.eventPreview = document.querySelector("#event-preview");
  elements.preparedEventPreview = document.querySelector("#prepared-event-preview");
  elements.preparationActions = document.querySelector("#preparation-actions");
  elements.syncCalendarButton = document.querySelector("#sync-calendar-button");
  elements.progressTitle = document.querySelector("#progress-title");
  elements.progressMeter = document.querySelector("#progress-meter");
  elements.progressFill = document.querySelector("#progress-fill");
  elements.progressCount = document.querySelector("#progress-count");
  elements.progressBatch = document.querySelector("#progress-batch");
  elements.successMessage = document.querySelector("#success-message");
  elements.successCount = document.querySelector("#success-count");
  elements.updateLocationButton = document.querySelector("#update-location-button");
}

function bindEvents() {
  elements.signInButton.addEventListener("click", handleSignIn);
  elements.retryAuthButton.addEventListener("click", handleRetrySignIn);
  elements.backHomeButton.addEventListener("click", () => {
    setView(state.accessToken ? "settings" : "landing");
  });
  elements.resetSessionButton.addEventListener("click", resetSession);
  elements.syncCalendarButton.addEventListener("click", handleCalendarSync);
  elements.updateLocationButton.addEventListener("click", handleUpdateLocation);
  elements.settingsForm.addEventListener("submit", handleSettingsConfirm);
  elements.useCurrentLocationButton.addEventListener("click", () => {
    switchToGeolocationMode(true);
  });
  elements.useManualLocationButton.addEventListener("click", () => {
    switchToManualMode("Enter a city, country, and timezone to continue.");
  });
  elements.retryLocationButton.addEventListener("click", () => {
    startGeolocationAttempt(true);
  });
  elements.useBrowserTimezoneButton.addEventListener("click", () => {
    state.location.manual.timeZone = state.browserTimeZone;
    clearConfirmedSetup();
    render();
  });

  elements.cityInput.addEventListener("input", (event) => {
    state.location.manual.city = event.target.value;
    clearConfirmedSetup();
    render();
  });
  elements.countryInput.addEventListener("input", (event) => {
    state.location.manual.country = event.target.value;
    clearConfirmedSetup();
    render();
  });
  elements.timezoneSelect.addEventListener("change", (event) => {
    state.location.manual.timeZone = event.target.value;
    clearConfirmedSetup();
    render();
  });
  elements.calculationMethod.addEventListener("change", (event) => {
    state.settings.calculationMethod = event.target.value;
    clearConfirmedSetup();
    render();
  });
  elements.reminderTiming.addEventListener("change", (event) => {
    state.settings.reminderMinutes = event.target.value;
    clearConfirmedSetup();
    render();
  });
  elements.eventDuration.addEventListener("change", (event) => {
    state.settings.durationMinutes = event.target.value;
    clearConfirmedSetup();
    render();
  });
  elements.syncRange.addEventListener("change", (event) => {
    state.settings.syncRange = event.target.value;
    clearConfirmedSetup();
    render();
  });
  elements.prayerGrid.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    const prayerId = event.target.value;
    const selectedPrayerIds = new Set(state.settings.selectedPrayerIds);

    if (event.target.checked) {
      selectedPrayerIds.add(prayerId);
    } else {
      selectedPrayerIds.delete(prayerId);
    }

    state.settings.selectedPrayerIds = [...selectedPrayerIds];
    clearConfirmedSetup();
    render();
  });
}

function renderStaticOptions() {
  populateSelect(
    elements.calculationMethod,
    APP_CONFIG.prayerMethods.map((method) => ({
      value: String(method.id),
      label: method.label,
    })),
  );

  populateSelect(
    elements.reminderTiming,
    APP_CONFIG.reminderOptions.map((option) => ({
      value: String(option.minutes),
      label: option.label,
    })),
  );

  populateSelect(
    elements.eventDuration,
    APP_CONFIG.durationOptions.map((option) => ({
      value: String(option.minutes),
      label: option.label,
    })),
  );

  populateSelect(
    elements.syncRange,
    APP_CONFIG.syncRanges.map((range) => ({
      value: range.id,
      label: range.label,
    })),
  );

  populateSelect(
    elements.timezoneSelect,
    getTimeZoneOptions().map((timeZone) => ({
      value: timeZone,
      label: timeZone,
    })),
  );

  elements.prayerGrid.innerHTML = APP_CONFIG.prayers
    .map(
      (prayer) => `
        <label class="prayer-option">
          <input type="checkbox" value="${prayer.id}" ${
            prayer.enabled ? "checked" : ""
          } />
          <span>${prayer.label}</span>
        </label>
      `,
    )
    .join("");
}

function populateSelect(select, options) {
  select.innerHTML = options
    .map(
      (option) => `<option value="${option.value}">${option.label}</option>`,
    )
    .join("");
}

async function initializeGoogleAuth() {
  try {
    await waitForGoogleIdentity();
    state.gisLoaded = true;

    if (!isClientIdConfigured()) {
      state.authReady = false;
      render();
      return;
    }

    state.authReady = true;
    render();
  } catch (error) {
    state.authReady = false;
    state.errorMessage =
      error instanceof Error ? error.message : "Unable to load Google sign-in.";
    render();
  }
}

async function handleSignIn() {
  if (!state.gisLoaded) {
    state.errorMessage = "Google Identity Services is still loading.";
    setView("error");
    return;
  }

  if (!isClientIdConfigured()) {
    state.errorMessage =
      "Add your OAuth client ID before testing Google sign-in.";
    setView("error");
    return;
  }

  state.authBusy = true;
  render();

  try {
    const response = await requestGoogleAccessToken({
      prompt: state.accessToken ? "" : "consent",
    });
    finishInitialSignIn(response);
  } catch (error) {
    state.authBusy = false;
    state.errorMessage = getAuthErrorMessage(error);
    setView("error");
  }
}

function handleRetrySignIn() {
  if (state.sync.status === "auth_required") {
    resumeSyncAfterReauth();
    return;
  }

  if (state.sync.status === "error" && state.preparation.status === "ready") {
    handleCalendarSync();
    return;
  }

  setView("landing");
  handleSignIn();
}

function finishInitialSignIn(response) {
  state.authBusy = false;

  if (!response || !response.access_token) {
    state.errorMessage = "Google sign-in finished without an access token.";
    setView("error");
    return;
  }

  state.accessToken = response.access_token;
  state.errorMessage = "";
  state.authReady = true;
  preparationRequestCounter += 1;
  state.location = createLocationState(state.browserTimeZone);
  state.settings = createSettingsState();
  state.confirmedSetup = null;
  state.preparation = createPreparationState();
  state.sync = createSyncState();
  setView("settings");
  startGeolocationAttempt(false);
}

function resetSession() {
  if (state.accessToken && state.gisLoaded) {
    window.google.accounts.oauth2.revoke(state.accessToken, () => {});
  }

  preparationRequestCounter += 1;
  state.location = createLocationState(state.browserTimeZone);
  state.settings = createSettingsState();
  state.confirmedSetup = null;
  state.preparation = createPreparationState();
  state.sync = createSyncState();
  state.accessToken = "";
  state.authBusy = false;
  state.errorMessage = "";
  setView("landing");
}

async function handleSettingsConfirm(event) {
  event.preventDefault();

  if (!isSetupValid()) {
    if (state.location.mode === "manual") {
      state.location.note = "Enter a city, country, and timezone to continue.";
    } else if (state.location.status !== "resolved") {
      state.location.note =
        "Use your current location or switch to manual entry to continue.";
    } else if (state.settings.selectedPrayerIds.length === 0) {
      state.location.note = "Choose at least one prayer to continue.";
    }

    render();
    return;
  }

  const requestId = ++preparationRequestCounter;
  state.confirmedSetup = buildPreparedSetup();
  state.preparation = {
    ...createPreparationState(),
    status: "loading",
    message:
      "Fetching prayer times for the rest of this year and all of next year.",
    requestId,
  };
  render();

  try {
    const preparedPrayerData = await preparePrayerEvents(state.confirmedSetup);

    if (requestId !== preparationRequestCounter) {
      return;
    }

    state.preparation = {
      ...createPreparationState(),
      ...preparedPrayerData,
      status: "ready",
      message: `Prepared ${preparedPrayerData.eventCount} prayer events in memory and kept them ready for calendar sync.`,
      requestId,
    };
  } catch (error) {
    if (requestId !== preparationRequestCounter) {
      return;
    }

    state.preparation = {
      ...createPreparationState(),
      status: "error",
      message: getPreparationErrorMessage(error),
      requestId,
    };
  }

  render();
}

async function handleCalendarSync() {
  if (state.preparation.status !== "ready" || state.sync.status === "running") {
    return;
  }

  state.sync = {
    ...createSyncState(),
    status: "running",
    phase: "listing",
    phaseChipLabel: "Checking existing times",
    title: "Checking existing prayer times...",
    description:
      "SalahSync checks existing prayer times, removes anything obsolete, and refreshes the current schedule.",
    detail: "Looking for future events previously created by this app.",
    countLabel: "Scanning calendar",
    batchLabel: "-",
    progressPercent: 0,
    setupSnapshot: state.confirmedSetup,
    preparedEvents: state.preparation.events,
    totalInserts: state.preparation.eventCount,
  };
  setView("progress");
  render();

  try {
    await continueCalendarSync();
  } catch (error) {
    await handleSyncFailure(error);
  }
}

function handleUpdateLocation() {
  setView("settings");
}

async function resumeSyncAfterReauth() {
  state.authBusy = true;
  render();

  try {
    const response = await requestGoogleAccessToken({ prompt: "" });

    if (!response?.access_token) {
      throw new Error("Google sign-in finished without an access token.");
    }

    state.accessToken = response.access_token;
    state.authBusy = false;
    state.errorMessage = "";
    state.sync.status = "running";
    setView("progress");
    render();
    await continueCalendarSync();
  } catch (error) {
    state.authBusy = false;
    state.errorMessage = getAuthErrorMessage(error);
    setView("error");
    render();
  }
}

async function continueCalendarSync() {
  if (state.sync.phase === "listing") {
    const existingPrayerEvents = await listFuturePrayerEvents(state.sync.setupSnapshot);
    const syncPlan = buildPrayerEventSyncPlan(
      existingPrayerEvents,
      state.sync.preparedEvents,
    );
    state.sync.deleteIds = syncPlan.deleteIds;
    state.sync.eventsToSync = syncPlan.eventsToSync;
    state.sync.totalDeletes = syncPlan.deleteIds.length;
    state.sync.deleteBatchIndex = 0;
    state.sync.totalInserts = syncPlan.eventsToSync.length;
  }

  await deleteFuturePrayerEventBatches();
  await insertPreparedPrayerEventBatches();
  finalizeSyncSuccess();
}

async function handleSyncFailure(error) {
  console.error("Calendar sync failed", error);

  if (isAuthExpiredError(error)) {
    state.sync.status = "auth_required";
    state.errorMessage =
      "Your Google session expired while syncing. Sign in again to resume from the last completed batch.";
    setView("error");
    render();
    return;
  }

  state.sync.status = "error";
  state.errorMessage = getSyncErrorMessage(error);
  setView("error");
  render();
}

async function listFuturePrayerEvents(setup) {
  const events = [];
  let pageToken = "";
  const timeMin = getSyncDeleteTimeMin(setup);

  do {
    const url = new URL(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    );

    url.searchParams.set("privateExtendedProperty", `source=${PRAYER_EVENT_SOURCE}`);
    url.searchParams.set("timeMin", timeMin);
    url.searchParams.set("maxResults", "2500");
    url.searchParams.set("showDeleted", "true");
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("fields", "nextPageToken,items(id,status)");

    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const payload = await withRateLimitRetry(
      () => fetchGoogleCalendarJson(url.toString()),
      {
        phase: "list",
      },
    );
    events.push(...(payload.items || []).filter((event) => event?.id));
    pageToken = payload.nextPageToken || "";
  } while (pageToken);

  return events;
}

function buildPrayerEventSyncPlan(existingEvents, preparedEvents) {
  const preparedEventIds = new Set(preparedEvents.map((event) => event.id));
  const existingById = new Map(
    existingEvents.map((event) => [event.id, event]),
  );
  const deleteIds = existingEvents
    .filter((event) => event.status !== "cancelled" && !preparedEventIds.has(event.id))
    .map((event) => event.id);
  const eventsToSync = preparedEvents.map((event) => ({
    ...event,
    syncMethod: existingById.has(event.id) ? "PUT" : "POST",
  }));

  return {
    deleteIds,
    eventsToSync,
  };
}

async function deleteFuturePrayerEventBatches() {
  const batches = chunkArray(state.sync.deleteIds, SYNC_BATCH_SIZE);
  const totalBatches = batches.length;

  if (totalBatches === 0) {
    setDeleteProgressState({
      batchNumber: 0,
      totalBatches: 0,
      finished: true,
    });
    render();
    return;
  }

  for (let batchIndex = state.sync.deleteBatchIndex; batchIndex < totalBatches; batchIndex += 1) {
    setDeleteProgressState({
      batchNumber: batchIndex + 1,
      totalBatches,
      finished: false,
    });
    render();

    await withRateLimitRetry(
      async () => {
        const batchResponses = await executeCalendarBatch(
          batches[batchIndex].map((eventId) => ({
            method: "DELETE",
            path: `/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
          })),
        );

        validateBatchResponses(batchResponses, {
          phase: "delete",
          allowNotFound: true,
        });

        return batchResponses;
      },
      {
        phase: "delete",
        batchNumber: batchIndex + 1,
        totalBatches,
      },
    );

    state.sync.deleteBatchIndex = batchIndex + 1;
    state.sync.deletedCount += batches[batchIndex].length;
    setDeleteProgressState({
      batchNumber: batchIndex + 1,
      totalBatches,
      finished: true,
    });
    render();

    if (batchIndex < totalBatches - 1) {
      await pauseBetweenBatches({
        phase: "delete",
        batchNumber: batchIndex + 1,
        totalBatches,
      });
    }
  }
}

async function insertPreparedPrayerEventBatches() {
  const batches = chunkArray(state.sync.eventsToSync, SYNC_BATCH_SIZE);
  const totalBatches = batches.length;

  if (totalBatches === 0) {
    throw new Error("No prepared prayer events are available to sync.");
  }

  for (let batchIndex = state.sync.insertBatchIndex; batchIndex < totalBatches; batchIndex += 1) {
    setInsertProgressState({
      batchNumber: batchIndex + 1,
      totalBatches,
      finished: false,
    });
    render();

    await withRateLimitRetry(
      async () => {
        await executeSyncWriteBatch(batches[batchIndex]);
      },
      {
        phase: "insert",
        batchNumber: batchIndex + 1,
        totalBatches,
      },
    );

    state.sync.insertBatchIndex = batchIndex + 1;
    state.sync.insertedCount += batches[batchIndex].length;
    setInsertProgressState({
      batchNumber: batchIndex + 1,
      totalBatches,
      finished: true,
    });
    render();

    if (batchIndex < totalBatches - 1) {
      await pauseBetweenBatches({
        phase: "insert",
        batchNumber: batchIndex + 1,
        totalBatches,
      });
    }
  }
}

function setDeleteProgressState({ batchNumber, totalBatches, finished }) {
  state.sync.phase = "delete";
  state.sync.phaseChipLabel =
    state.sync.totalDeletes > 0 ? "Removing old times" : "No old times found";
  state.sync.title =
    state.sync.totalDeletes > 0
      ? "Removing old prayer times..."
      : "No old prayer times needed removing.";
  state.sync.description =
    state.sync.totalDeletes > 0
      ? "SalahSync removes obsolete future prayer events before syncing the refreshed schedule."
      : "No obsolete future prayer events were found, so sync will move straight to writing the refreshed schedule.";
  state.sync.detail =
    state.sync.totalDeletes > 0
      ? "Removing tagged events in batches of 50."
      : "Delete step skipped because there were no future tagged events.";
  state.sync.countLabel =
    state.sync.totalDeletes > 0
      ? `${state.sync.deletedCount} / ${state.sync.totalDeletes} removed`
      : "0 events removed";
  state.sync.batchLabel =
    state.sync.totalDeletes > 0
      ? finished
        ? `Batch ${batchNumber} of ${totalBatches} complete`
        : `Processing batch ${batchNumber} of ${totalBatches}`
      : "Delete skipped";

  if (state.sync.totalDeletes === 0) {
    state.sync.progressPercent = 0;
    return;
  }

  const completedDeletes = Math.min(state.sync.deletedCount, state.sync.totalDeletes);
  state.sync.progressPercent = Math.round(
    (completedDeletes / state.sync.totalDeletes) * 100,
  );
}

function setInsertProgressState({ batchNumber, totalBatches, finished }) {
  state.sync.phase = "insert";
  state.sync.phaseChipLabel = "Syncing prayer times";
  state.sync.title = "Syncing prayer times...";
  state.sync.description =
    "Keep this page open while prayer times are written to Google Calendar. The first sync can take several minutes.";
  state.sync.detail = `Syncing prepared events in paced batches of ${SYNC_BATCH_SIZE}.`;
  state.sync.countLabel = `${state.sync.insertedCount} / ${state.sync.totalInserts} synced`;
  state.sync.batchLabel = finished
    ? `Batch ${batchNumber} of ${totalBatches} complete`
    : `Processing batch ${batchNumber} of ${totalBatches}`;

  const completedInserts = Math.min(state.sync.insertedCount, state.sync.totalInserts);
  const insertShare =
    state.sync.totalInserts > 0
      ? completedInserts / state.sync.totalInserts
      : 0;

  state.sync.progressPercent = Math.round(insertShare * 100);
}

function finalizeSyncSuccess() {
  state.sync.status = "success";
  state.sync.phase = "complete";
  state.sync.progressPercent = 100;
  state.sync.successMessage =
    state.sync.deletedCount > 0
      ? "Old prayer times were removed and the refreshed schedule is now in Google Calendar."
      : "Your prayer times have been synced to Google Calendar.";
  setView("success");
  render();
}

function setView(viewName) {
  state.currentView = viewName;
  render();
}

function render() {
  elements.views.forEach((view) => {
    view.classList.toggle("is-active", view.dataset.view === state.currentView);
  });

  if (state.currentView === "error" && state.errorMessage) {
    elements.errorMessage.textContent = state.errorMessage;
  }

  if (!state.gisLoaded) {
    elements.signInButton.disabled = true;
  } else if (state.authBusy) {
    elements.signInButton.disabled = true;
  } else {
    elements.signInButton.disabled = false;
  }

  renderSettings();
  renderConfirmation();
  renderProgress();
  renderSuccess();

  elements.retryAuthButton.textContent =
    state.sync.status === "auth_required"
      ? "Resume sync"
      : state.sync.status === "error"
        ? "Try sync again"
        : "Retry sign-in";
}

function renderSettings() {
  elements.calculationMethod.value = state.settings.calculationMethod;
  elements.reminderTiming.value = state.settings.reminderMinutes;
  elements.eventDuration.value = state.settings.durationMinutes;
  elements.syncRange.value = state.settings.syncRange;
  elements.cityInput.value = state.location.manual.city;
  elements.countryInput.value = state.location.manual.country;
  elements.timezoneSelect.value = state.location.manual.timeZone;
  elements.useBrowserTimezoneButton.textContent = `Use ${state.browserTimeZone}`;

  elements.useCurrentLocationButton.classList.toggle(
    "is-active",
    state.location.mode === "geolocation",
  );
  elements.useManualLocationButton.classList.toggle(
    "is-active",
    state.location.mode === "manual",
  );

  if (state.location.mode === "manual") {
    elements.manualLocationFields.hidden = false;
    elements.retryLocationButton.hidden = true;
    elements.locationModeLabel.textContent = "Manual location";
    elements.locationValue.textContent = getManualLocationValue();
    elements.locationNote.textContent =
      state.location.note ||
      "Manual entry lets you choose a city and confirm the timezone that should be used.";
  } else {
    elements.manualLocationFields.hidden = true;
    elements.retryLocationButton.hidden = false;
    elements.retryLocationButton.disabled = state.location.status === "loading";
    elements.retryLocationButton.textContent =
      state.location.status === "loading" ? "Detecting..." : "Retry";
    elements.locationModeLabel.textContent = getGeolocationHeading();
    elements.locationValue.textContent = getGeolocationValue();
    elements.locationNote.textContent = getGeolocationNote();
  }

  const selectedPrayerIds = new Set(state.settings.selectedPrayerIds);
  [...elements.prayerGrid.querySelectorAll("input[type='checkbox']")].forEach(
    (input) => {
      input.checked = selectedPrayerIds.has(input.value);
    },
  );

  elements.confirmSettingsButton.disabled =
    !isSetupValid() || state.preparation.status === "loading";
  elements.confirmSettingsButton.textContent =
    state.preparation.status === "loading"
      ? "Preparing prayer times..."
      : state.preparation.status === "ready"
        ? "Refresh prayer times"
        : "Prepare prayer times";
}

function renderConfirmation() {
  if (!state.confirmedSetup) {
    elements.confirmationPanel.hidden = true;
    elements.preparationActions.hidden = true;
    elements.settingsForm.classList.remove("settings-form--with-confirmation");
    return;
  }

  elements.confirmationPanel.hidden = false;
  elements.summaryLocation.textContent = state.confirmedSetup.locationLabel;
  elements.summaryTimezone.textContent = state.confirmedSetup.timeZone;
  elements.summaryMethod.textContent = state.confirmedSetup.calculationMethodLabel;
  elements.summaryTimes.textContent = state.confirmedSetup.prayerLabels.join(", ");
  elements.summaryRange.textContent = state.confirmedSetup.syncRangeLabel;
  elements.summaryReminder.textContent = state.confirmedSetup.reminderLabel;
  elements.summaryDuration.textContent = state.confirmedSetup.durationLabel;
  elements.preparationStatus.textContent = state.preparation.message;
  elements.preparationStatus.classList.remove(
    "preparation-status--loading",
    "preparation-status--ready",
    "preparation-status--error",
  );

  if (state.preparation.status === "loading") {
    elements.preparationStatus.classList.add("preparation-status--loading");
  } else if (state.preparation.status === "ready") {
    elements.preparationStatus.classList.add("preparation-status--ready");
  } else if (state.preparation.status === "error") {
    elements.preparationStatus.classList.add("preparation-status--error");
  }

  const hasPreparedPrayerData = state.preparation.status === "ready";
  elements.preparationSummary.hidden = !hasPreparedPrayerData;
  elements.eventPreview.hidden = !hasPreparedPrayerData;
  elements.preparationActions.hidden = !hasPreparedPrayerData;
  elements.syncCalendarButton.disabled = state.sync.status === "running";
  elements.settingsForm.classList.add("settings-form--with-confirmation");

  if (!hasPreparedPrayerData) {
    elements.preparedEventPreview.innerHTML = "";
    return;
  }

  elements.preparedEventCount.textContent = `${state.preparation.eventCount} events across ${state.preparation.dayCount} days`;
  elements.preparedCoverage.textContent = state.preparation.coverageLabel;
  elements.preparedSource.textContent = state.preparation.sourceLabel;
  elements.preparedEventPreview.innerHTML = state.preparation.previewItems
    .map((item) => `<li>${item}</li>`)
    .join("");
}

function renderProgress() {
  const progressPercent = Math.max(0, Math.min(100, state.sync.progressPercent));

  elements.progressTitle.textContent = state.sync.title;
  elements.progressFill.style.width = `${progressPercent}%`;
  elements.progressMeter.setAttribute("aria-valuenow", String(progressPercent));
  elements.progressCount.textContent = state.sync.countLabel;
  elements.progressBatch.textContent = state.sync.batchLabel;
}

function renderSuccess() {
  elements.successMessage.textContent = state.sync.successMessage;
  elements.successCount.textContent = `${state.sync.insertedCount} events synced`;
}

function isClientIdConfigured() {
  return (
    APP_CONFIG.googleClientId &&
    !APP_CONFIG.googleClientId.startsWith("YOUR_GOOGLE_CLIENT_ID")
  );
}

function createLocationState(timeZone) {
  return {
    mode: "geolocation",
    status: "idle",
    note: "",
    coords: null,
    manual: {
      city: "",
      country: "",
      timeZone,
    },
  };
}

function createSettingsState() {
  return {
    calculationMethod: String(APP_CONFIG.prayerMethods[0].id),
    reminderMinutes: DEFAULT_REMINDER_MINUTES,
    durationMinutes: DEFAULT_DURATION_MINUTES,
    syncRange: DEFAULT_SYNC_RANGE_ID,
    selectedPrayerIds: [...DEFAULT_SELECTED_PRAYERS],
  };
}

function createPreparationState() {
  return {
    status: "idle",
    message: "Confirm your setup to prepare prayer times.",
    eventCount: 0,
    dayCount: 0,
    coverageLabel: "",
    sourceLabel: "",
    events: [],
    previewItems: [],
    requestId: 0,
  };
}

function createSyncState() {
  return {
    status: "idle",
    phase: "idle",
    phaseChipLabel: "Preparing sync",
    title: "Preparing your calendar sync...",
    description:
      "Keep this page open while prayer times are being written to Google Calendar. The first sync can take several minutes.",
    detail:
      "Prayer events are added in paced batches so the app stays within Google Calendar limits.",
    countLabel: "Waiting to begin",
    batchLabel: "-",
    progressPercent: 0,
    deletedCount: 0,
    insertedCount: 0,
    totalDeletes: 0,
    totalInserts: 0,
    deleteIds: [],
    preparedEvents: [],
    eventsToSync: [],
    deleteBatchIndex: 0,
    insertBatchIndex: 0,
    successMessage: "Your prayer times have been added to Google Calendar.",
    setupSnapshot: null,
  };
}

function getTimeZoneOptions() {
  const supportedTimeZones =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : FALLBACK_TIME_ZONES;
  const mergedTimeZones = [state.browserTimeZone, ...supportedTimeZones].filter(
    Boolean,
  );

  return [...new Set(mergedTimeZones)];
}

function detectBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function clearConfirmedSetup() {
  preparationRequestCounter += 1;
  state.confirmedSetup = null;
  state.preparation = createPreparationState();
  state.sync = createSyncState();
}

function switchToManualMode(note = "") {
  state.location.mode = "manual";
  state.location.status = "manual";
  state.location.note = note;
  clearConfirmedSetup();
  render();
}

function switchToGeolocationMode(requestLocation) {
  state.location.mode = "geolocation";
  state.location.note = "";
  clearConfirmedSetup();

  if (state.location.coords && !requestLocation) {
    state.location.status = "resolved";
    render();
    return;
  }

  startGeolocationAttempt(true);
}

function startGeolocationAttempt(userInitiated) {
  if (!navigator.geolocation) {
    switchToManualMode("Current location is unavailable, so manual entry is ready.");
    return;
  }

  state.location.mode = "geolocation";
  state.location.status = "loading";
  state.location.note = userInitiated
    ? "Checking your current location."
    : "Trying to use your current location automatically.";
  clearConfirmedSetup();
  render();

  navigator.geolocation.getCurrentPosition(
    (position) => {
      state.location.coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      state.location.status = "resolved";
      state.location.note = "";
      clearConfirmedSetup();
      render();
    },
    () => {
      state.location.coords = null;
      switchToManualMode(
        "We could not use your current location, so manual entry is ready.",
      );
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    },
  );
}

function getGeolocationHeading() {
  if (state.location.status === "loading") {
    return "Detecting current location";
  }

  if (state.location.status === "resolved") {
    return "Current location ready";
  }

  return "Use current location";
}

function getGeolocationValue() {
  if (state.location.status === "loading") {
    return "Allow location access to use your current coordinates and browser timezone.";
  }

  if (state.location.status === "resolved" && state.location.coords) {
    return `Coordinates ${formatCoordinates(state.location.coords.latitude, state.location.coords.longitude)}`;
  }

  return "Use your current coordinates if you want prayer times to follow where you are right now.";
}

function getGeolocationNote() {
  if (state.location.status === "loading") {
    return state.location.note;
  }

  if (state.location.status === "resolved") {
    return `Timezone: ${state.browserTimeZone}`;
  }

  return (
    state.location.note ||
    "If you would rather choose another place, switch to manual entry."
  );
}

function getManualLocationValue() {
  const city = state.location.manual.city.trim();
  const country = state.location.manual.country.trim();

  if (!city && !country) {
    return "Enter the city, country, and timezone that should be used for prayer calculations.";
  }

  return [city, country].filter(Boolean).join(", ");
}

function formatCoordinates(latitude, longitude) {
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

function isSetupValid() {
  if (state.settings.selectedPrayerIds.length === 0) {
    return false;
  }

  if (state.location.mode === "geolocation") {
    return state.location.status === "resolved" && Boolean(state.location.coords);
  }

  return Boolean(
    state.location.manual.city.trim() &&
      state.location.manual.country.trim() &&
      state.location.manual.timeZone.trim(),
  );
}

function buildPreparedSetup() {
  const calculationMethod = APP_CONFIG.prayerMethods.find(
    (method) => String(method.id) === state.settings.calculationMethod,
  );
  const syncRange = APP_CONFIG.syncRanges.find(
    (range) => range.id === state.settings.syncRange,
  );
  const reminder = APP_CONFIG.reminderOptions.find(
    (option) => String(option.minutes) === state.settings.reminderMinutes,
  );
  const duration = APP_CONFIG.durationOptions.find(
    (option) => String(option.minutes) === state.settings.durationMinutes,
  );
  const prayerLabels = APP_CONFIG.prayers
    .filter((prayer) => state.settings.selectedPrayerIds.includes(prayer.id))
    .map((prayer) => prayer.label);
  const locationLabel =
    state.location.mode === "geolocation" && state.location.coords
      ? `Current location (${formatCoordinates(
          state.location.coords.latitude,
          state.location.coords.longitude,
        )})`
      : `${state.location.manual.city.trim()}, ${state.location.manual.country.trim()}`;
  const timeZone =
    state.location.mode === "geolocation"
      ? state.browserTimeZone
      : state.location.manual.timeZone;

  return {
    source: state.location.mode,
    timeZone,
    locationLabel,
    calculationMethodId: Number(state.settings.calculationMethod),
    calculationMethodLabel: calculationMethod?.label ?? "",
    syncRangeId: state.settings.syncRange,
    syncRangeLabel: syncRange?.label ?? "",
    prayerIds: [...state.settings.selectedPrayerIds],
    prayerLabels,
    reminderMinutes: Number(state.settings.reminderMinutes),
    reminderLabel: reminder?.label ?? "",
    durationMinutes: Number(state.settings.durationMinutes),
    durationLabel: duration?.label ?? "",
    location:
      state.location.mode === "geolocation" && state.location.coords
        ? {
            latitude: state.location.coords.latitude,
            longitude: state.location.coords.longitude,
          }
        : {
            city: state.location.manual.city.trim(),
            country: state.location.manual.country.trim(),
          },
  };
}

async function preparePrayerEvents(setup) {
  const syncWindow = getSyncWindow(setup.timeZone, setup.syncRangeId);
  const calendarResponses = await Promise.all(
    syncWindow.years.map((year) => fetchPrayerCalendarYear(setup, year)),
  );

  const futurePrayerDays = calendarResponses
    .flatMap((response) => flattenPrayerCalendarData(response.data))
    .map(normalizePrayerDay)
    .filter(Boolean)
    .filter(
      (day) =>
        day.dateKey >= syncWindow.startKey && day.dateKey <= syncWindow.endKey,
    )
    .sort((left, right) => left.dateKey.localeCompare(right.dateKey));

  const events = futurePrayerDays.flatMap((day) =>
    buildPrayerEventsForDay(day, setup),
  );

  if (events.length === 0) {
    throw new Error("No future prayer times were returned for this location.");
  }

  return {
    eventCount: events.length,
    dayCount: futurePrayerDays.length,
    coverageLabel: `${formatDateKeyForDisplay(
      events[0].meta.dateKey,
      setup.timeZone,
    )} to ${formatDateKeyForDisplay(
      events[events.length - 1].meta.dateKey,
      setup.timeZone,
    )}`,
    sourceLabel:
      setup.source === "geolocation"
        ? `Aladhan by coordinates using ${setup.calculationMethodLabel}`
        : `Aladhan by city using ${setup.calculationMethodLabel}`,
    events,
    previewItems: events.slice(0, 5).map((event) => formatPreparedEventPreview(event)),
  };
}

async function fetchPrayerCalendarYear(setup, year) {
  const url = new URL(
    setup.source === "geolocation"
      ? `https://api.aladhan.com/v1/calendar/${year}`
      : `https://api.aladhan.com/v1/calendarByCity/${year}`,
  );

  const searchParams = new URLSearchParams({
    method: String(setup.calculationMethodId),
  });

  if (setup.source === "geolocation") {
    searchParams.set("latitude", String(setup.location.latitude));
    searchParams.set("longitude", String(setup.location.longitude));
  } else {
    searchParams.set("city", setup.location.city);
    searchParams.set("country", setup.location.country);
  }

  url.search = searchParams.toString();

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error("Unable to reach the prayer times service right now.");
  }

  const payload = await response.json();

  if (payload.code !== 200 || !payload.data) {
    throw new Error(payload.status || "Prayer times could not be prepared.");
  }

  return payload;
}

function flattenPrayerCalendarData(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === "object") {
    return Object.values(data).flatMap((value) =>
      Array.isArray(value) ? value : [],
    );
  }

  return [];
}

function normalizePrayerDay(day) {
  const gregorianDate = day?.date?.gregorian?.date;

  if (!gregorianDate || !day?.timings) {
    return null;
  }

  return {
    dateKey: gregorianToDateKey(gregorianDate),
    readableDate: day.date.readable || gregorianDate,
    timings: day.timings,
  };
}

function buildPrayerEventsForDay(day, setup) {
  return APP_CONFIG.prayers
    .filter((prayer) => setup.prayerIds.includes(prayer.id))
    .map((prayer) => buildPrayerEventPayload(day, prayer, setup))
    .filter(Boolean);
}

function buildPrayerEventPayload(day, prayer, setup) {
  const timingKey = PRAYER_TIMING_KEYS[prayer.id];
  const rawTiming = day.timings[timingKey];
  const parsedTiming = parsePrayerTime(rawTiming);

  if (!parsedTiming) {
    return null;
  }

  const startDateTime = `${day.dateKey}T${parsedTiming.hours}:${parsedTiming.minutes}:00`;
  const endDateTime = addMinutesToLocalDateTime(
    startDateTime,
    setup.durationMinutes,
  );

  return {
    id: buildStableEventId(day.dateKey, parsedTiming.hours, parsedTiming.minutes, prayer.id),
    summary: prayer.label,
    start: {
      dateTime: startDateTime,
      timeZone: setup.timeZone,
    },
    end: {
      dateTime: endDateTime,
      timeZone: setup.timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        {
          method: "popup",
          minutes: setup.reminderMinutes,
        },
      ],
    },
    extendedProperties: {
      private: {
        source: PRAYER_EVENT_SOURCE,
      },
    },
    meta: {
      dateKey: day.dateKey,
      prayerId: prayer.id,
      prayerLabel: prayer.label,
      rawTiming,
    },
  };
}

function buildStableEventId(dateKey, hours, minutes, prayerId) {
  const dateId = dateKey.replaceAll("-", "");
  const prayerCode = PRAYER_EVENT_ID_CODES[prayerId] || "99";
  return `ps${dateId}${hours}${minutes}${prayerCode}`;
}

function getSyncDeleteTimeMin(setup) {
  const activeTimeZone = setup?.timeZone || state.browserTimeZone;
  const activeSyncRangeId = setup?.syncRangeId || DEFAULT_SYNC_RANGE_ID;
  const syncWindow = getSyncWindow(activeTimeZone, activeSyncRangeId);

  return getTimeZoneDateTimeIso(syncWindow.startKey, "00:00:00", activeTimeZone);
}

function getTimeZoneDateTimeIso(dateKey, timePart, timeZone) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
  let adjustedDate = utcGuess;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const zonedParts = getDatePartsInTimeZone(adjustedDate, timeZone);
    const desiredEpoch = Date.UTC(year, month - 1, day, hours, minutes, seconds);
    const zonedEpoch = Date.UTC(
      zonedParts.year,
      zonedParts.month - 1,
      zonedParts.day,
      zonedParts.hours,
      zonedParts.minutes,
      zonedParts.seconds,
    );
    const diffMs = desiredEpoch - zonedEpoch;

    if (diffMs === 0) {
      break;
    }

    adjustedDate = new Date(adjustedDate.getTime() + diffMs);
  }

  return adjustedDate.toISOString();
}

function getDatePartsInTimeZone(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const partByType = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(partByType.year),
    month: Number(partByType.month),
    day: Number(partByType.day),
    hours: Number(partByType.hour),
    minutes: Number(partByType.minute),
    seconds: Number(partByType.second),
  };
}

function parsePrayerTime(rawTiming) {
  const match = rawTiming?.match(/(\d{1,2}):(\d{2})/);

  if (!match) {
    return null;
  }

  return {
    hours: match[1].padStart(2, "0"),
    minutes: match[2],
  };
}

function addMinutesToLocalDateTime(localDateTime, minutesToAdd) {
  const [datePart, timePart] = localDateTime.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));

  utcDate.setUTCMinutes(utcDate.getUTCMinutes() + minutesToAdd);

  return [
    utcDate.getUTCFullYear(),
    String(utcDate.getUTCMonth() + 1).padStart(2, "0"),
    String(utcDate.getUTCDate()).padStart(2, "0"),
  ].join("-")
    .concat(
      `T${String(utcDate.getUTCHours()).padStart(2, "0")}:${String(
        utcDate.getUTCMinutes(),
      ).padStart(2, "0")}:00`,
    );
}

function gregorianToDateKey(gregorianDate) {
  const [day, month, year] = gregorianDate.split("-");
  return `${year}-${month}-${day}`;
}

function getSyncWindow(timeZone, syncRangeId) {
  const todayParts = getLocalDateParts(timeZone);
  const startDate = createUtcDateFromParts(todayParts.year, todayParts.month, todayParts.day);
  let endDate = startDate;

  if (syncRangeId === "next_30_days") {
    endDate = addDaysToUtcDate(startDate, 29);
  } else if (syncRangeId === "next_90_days") {
    endDate = addDaysToUtcDate(startDate, 89);
  } else if (syncRangeId === "rest_of_year") {
    endDate = createUtcDateFromParts(todayParts.year, 12, 31);
  } else {
    endDate = createUtcDateFromParts(todayParts.year + 1, 12, 31);
  }

  return {
    startKey: dateToDateKey(startDate),
    endKey: dateToDateKey(endDate),
    years: getYearsBetween(todayParts.year, endDate.getUTCFullYear()),
  };
}

function getLocalDateParts(timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const partByType = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(partByType.year),
    month: Number(partByType.month),
    day: Number(partByType.day),
  };
}

function createUtcDateFromParts(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function addDaysToUtcDate(date, dayCount) {
  const nextDate = new Date(date.getTime());
  nextDate.setUTCDate(nextDate.getUTCDate() + dayCount);
  return nextDate;
}

function dateToDateKey(date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function getYearsBetween(startYear, endYear) {
  const years = [];

  for (let year = startYear; year <= endYear; year += 1) {
    years.push(year);
  }

  return years;
}

function formatDateKeyForDisplay(dateKey, timeZone) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(utcDate);
}

function formatPreparedEventPreview(event) {
  const dateLabel = formatDateKeyForDisplay(
    event.meta.dateKey,
    event.start.timeZone,
  );
  const timeLabel = event.start.dateTime.slice(11, 16);

  return `${dateLabel} · ${event.summary} at ${timeLabel} (${event.start.timeZone})`;
}

function getPreparationErrorMessage(error) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Unable to reach")) {
    return "Prayer times could not be fetched right now. Please try again shortly.";
  }

  if (message.includes("No future prayer times")) {
    return "No future prayer times were returned for this setup. Try another location or method.";
  }

  return "Prayer times could not be prepared right now. Please try again.";
}

function getSyncErrorMessage(error) {
  if (isAuthExpiredError(error)) {
    return "Your Google session expired while syncing.";
  }

  if (isRateLimitError(error)) {
    return "Google Calendar is temporarily rate limiting sync. SalahSync slows down automatically, but this run hit the limit too many times. Please wait a minute and try again.";
  }

  if (isCalendarBatchItemError(error)) {
    const statusPart = error.statusCode ? ` (${error.statusCode})` : "";
    const detailPart = error.detail ? ` ${error.detail}` : "";
    return `Google Calendar rejected one ${error.phase} request${statusPart}.${detailPart}`;
  }

  const message = error instanceof Error ? error.message : "";

  if (message.includes("rate limiting")) {
    return "Google Calendar is rate limiting requests right now. Please wait a moment and try again.";
  }

  if (message.includes("batch")) {
    return "Google Calendar could not process one of the sync batches. Please try again.";
  }

  return "Google Calendar sync could not be completed right now. Please try again.";
}

function getAuthErrorMessage(error) {
  return error && error.type === "popup_failed_to_open"
    ? "The Google sign-in window was blocked by the browser."
    : "Google sign-in was cancelled or could not be completed.";
}

async function withRateLimitRetry(operation, context = {}) {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (!isRateLimitError(error) || attempt >= SYNC_RATE_LIMIT_MAX_RETRIES) {
        throw error;
      }

      const delayMs = getBackoffDelayMs(attempt);
      updateRateLimitProgress(context, delayMs, attempt + 1, error);
      render();
      await wait(delayMs);
      attempt += 1;
    }
  }
}

async function pauseBetweenBatches(context) {
  updateCooldownProgress(context, SYNC_BATCH_DELAY_MS);
  render();
  await wait(SYNC_BATCH_DELAY_MS);
}

function updateRateLimitProgress(context, delayMs, attemptNumber, error) {
  const phaseLabel = getPhaseLabel(context.phase);
  const retryMessage = `Google asked us to slow down during ${phaseLabel}. Retrying in ${formatDuration(
    delayMs,
  )} (attempt ${attemptNumber} of ${SYNC_RATE_LIMIT_MAX_RETRIES + 1}).`;
  const detailSuffix = error.detail ? ` ${error.detail}` : "";

  state.sync.detail = `${retryMessage}${detailSuffix}`.trim();

  if (context.phase === "insert") {
    state.sync.batchLabel = `Batch ${context.batchNumber} of ${context.totalBatches}`;
  } else if (context.phase === "delete") {
    state.sync.batchLabel = `Batch ${context.batchNumber} of ${context.totalBatches}`;
  } else if (context.phase === "list") {
    state.sync.batchLabel = "Retrying request";
  }
}

function updateCooldownProgress(context, delayMs) {
  const phaseLabel = getPhaseLabel(context.phase);
  state.sync.detail = `Cooling down for ${formatDuration(
    delayMs,
  )} before the next ${phaseLabel} batch to stay within Google Calendar limits.`;
}

function getBackoffDelayMs(attempt) {
  const exponentialDelay = Math.min(
    SYNC_RATE_LIMIT_MAX_DELAY_MS,
    SYNC_RATE_LIMIT_BASE_DELAY_MS * 2 ** attempt,
  );
  return exponentialDelay + Math.floor(Math.random() * 1000);
}

function formatDuration(durationMs) {
  const seconds = Math.max(1, Math.round(durationMs / 1000));
  return seconds === 1 ? "1 second" : `${seconds} seconds`;
}

function getPhaseLabel(phase) {
  if (phase === "delete") {
    return "delete";
  }

  if (phase === "insert") {
    return "insert";
  }

  return "calendar check";
}

function requestGoogleAccessToken({ prompt }) {
  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: APP_CONFIG.googleClientId,
      scope: APP_CONFIG.googleScopes.join(" "),
      callback: (response) => resolve(response),
      error_callback: (error) => reject(error),
    });

    tokenClient.requestAccessToken({ prompt });
  });
}

async function fetchGoogleCalendarJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${state.accessToken}`,
    },
  });

  if (response.status === 401) {
    throw createAuthExpiredError();
  }

  const errorPayload = await tryParseJsonResponse(response);

  if (isRateLimitedCalendarResponse(response.status, errorPayload)) {
    throw createRateLimitError({
      statusCode: response.status,
      detail: getGoogleApiErrorDetail(errorPayload),
      phase: "request",
    });
  }

  if (!response.ok) {
    throw new Error("Google Calendar request failed.");
  }

  return errorPayload;
}

async function executeCalendarBatch(requests) {
  if (requests.length === 0) {
    return [];
  }

  const boundary =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? `batch_${crypto.randomUUID()}`
      : `batch_${Date.now()}`;
  const response = await fetch("https://www.googleapis.com/batch/calendar/v3", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${state.accessToken}`,
      "Content-Type": `multipart/mixed; boundary=${boundary}`,
    },
    body: buildBatchRequestBody(requests, boundary),
  });

  if (response.status === 401) {
    throw createAuthExpiredError();
  }

  const contentType = response.headers.get("content-type") || "";
  const responseBoundary = getMultipartBoundary(contentType);
  const responseText = await response.text();

  if (isLikelyJsonContentType(contentType)) {
    const errorPayload = safeJsonParse(responseText);

    if (isRateLimitedCalendarResponse(response.status, errorPayload)) {
      throw createRateLimitError({
        statusCode: response.status,
        detail: getGoogleApiErrorDetail(errorPayload),
        phase: "batch",
      });
    }
  }

  if (!response.ok) {
    throw new Error("Google Calendar batch request failed.");
  }

  if (!responseBoundary) {
    throw new Error("Google Calendar batch response could not be parsed.");
  }

  return parseBatchResponse(responseText, responseBoundary);
}

function buildBatchRequestBody(requests, boundary) {
  return requests
    .map((request, index) => {
      const requestLines = [
        `--${boundary}`,
        "Content-Type: application/http",
        `Content-ID: <item-${index}>`,
        "",
        `${request.method} ${request.path}`,
      ];

      if (request.body) {
        requestLines.push("Content-Type: application/json; charset=UTF-8");
        requestLines.push("");
        requestLines.push(JSON.stringify(request.body));
      }

      requestLines.push("");
      return requestLines.join("\r\n");
    })
    .concat(`--${boundary}--`)
    .join("\r\n");
}

async function executeSyncWriteBatch(events) {
  const batchResponses = await executeCalendarBatch(
    events.map((event) => ({
      method: event.syncMethod,
      path:
        event.syncMethod === "PUT"
          ? `/calendar/v3/calendars/primary/events/${encodeURIComponent(event.id)}`
          : "/calendar/v3/calendars/primary/events",
      body: buildCalendarEventBody(event),
    })),
  );

  validateSyncWriteBatchResponses(batchResponses, events);
}

function getMultipartBoundary(contentType) {
  const match = contentType.match(/boundary=([^;]+)/i);
  return match ? match[1].trim().replace(/^"|"$/g, "") : "";
}

function parseBatchResponse(responseText, boundary) {
  return responseText
    .replace(/\r\n/g, "\n")
    .split(`--${boundary}`)
    .map((part) => part.trim())
    .filter((part) => part && part !== "--")
    .map((part) => {
      const httpIndex = part.indexOf("HTTP/1.1");
      const preamble = httpIndex >= 0 ? part.slice(0, httpIndex).trim() : "";
      const httpSection = httpIndex >= 0 ? part.slice(httpIndex).trim() : part;
      const [headBlock, ...bodyBlocks] = httpSection.split("\n\n");
      const headLines = headBlock.split("\n");
      const statusLine = headLines[0] || "";
      const statusCode = Number(statusLine.split(" ")[1] || 0);
      const headers = Object.fromEntries(
        headLines.slice(1).map((line) => {
          const separatorIndex = line.indexOf(":");
          const key = line.slice(0, separatorIndex).trim().toLowerCase();
          const value = line.slice(separatorIndex + 1).trim();
          return [key, value];
        }),
      );
      const body = bodyBlocks.join("\n\n").trim();

      return {
        contentId: preamble.match(/Content-ID:\s*(.+)/i)?.[1] || "",
        statusCode,
        headers,
        body,
        json:
          body && headers["content-type"]?.includes("application/json")
            ? JSON.parse(body)
            : null,
      };
    });
}

function validateBatchResponses(responses, { phase, allowNotFound = false }) {
  for (const response of responses) {
    if (response.statusCode === 401) {
      throw createAuthExpiredError();
    }

    if (isRateLimitedCalendarResponse(response.statusCode, response.json)) {
      throw createRateLimitError({
        statusCode: response.statusCode,
        detail: getGoogleApiErrorDetail(response.json),
        phase,
        response,
      });
    }

    if (allowNotFound && response.statusCode === 404) {
      continue;
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw createCalendarBatchItemError(response, phase);
    }
  }
}

function validateSyncWriteBatchResponses(responses, events) {
  for (const [index, response] of responses.entries()) {
    const event = events[index];
    const phase = event?.syncMethod === "PUT" ? "update" : "insert";

    if (response.statusCode === 401) {
      throw createAuthExpiredError();
    }

    if (isRateLimitedCalendarResponse(response.statusCode, response.json)) {
      throw createRateLimitError({
        statusCode: response.statusCode,
        detail: getGoogleApiErrorDetail(response.json),
        phase,
        response,
      });
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw createCalendarBatchItemError(response, phase);
    }
  }
}

function buildCalendarEventBody(event) {
  return {
    id: event.id,
    summary: event.summary,
    colorId: PRAYER_EVENT_COLOR_ID,
    start: event.start,
    end: event.end,
    status: "confirmed",
    reminders: event.reminders,
    extendedProperties: event.extendedProperties,
  };
}

function chunkArray(items, chunkSize) {
  const chunks = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

function createAuthExpiredError() {
  const error = new Error("Google access token expired.");
  error.code = "AUTH_EXPIRED";
  return error;
}

function isAuthExpiredError(error) {
  return Boolean(error && typeof error === "object" && error.code === "AUTH_EXPIRED");
}

function createRateLimitError({ statusCode, detail, phase, response = null }) {
  const error = new Error("Google Calendar rate limit reached.");
  error.code = "RATE_LIMIT_EXCEEDED";
  error.statusCode = statusCode;
  error.detail = cleanBatchErrorDetail(detail);
  error.phase = phase;
  error.response = response;
  return error;
}

function isRateLimitError(error) {
  return Boolean(error && typeof error === "object" && error.code === "RATE_LIMIT_EXCEEDED");
}

function createCalendarBatchItemError(response, phase) {
  const detail =
    response.json?.error?.message ||
    response.json?.error?.errors?.[0]?.message ||
    response.body ||
    "";
  const error = new Error(`Google Calendar batch ${phase} failed.`);

  error.code = "CALENDAR_BATCH_ITEM_FAILED";
  error.phase = phase;
  error.statusCode = response.statusCode;
  error.detail = cleanBatchErrorDetail(detail);
  error.response = response;
  return error;
}

function cleanBatchErrorDetail(detail) {
  return String(detail || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

function isCalendarBatchItemError(error) {
  return Boolean(
    error && typeof error === "object" && error.code === "CALENDAR_BATCH_ITEM_FAILED",
  );
}

async function tryParseJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!isLikelyJsonContentType(contentType)) {
    return null;
  }

  return safeJsonParse(await response.text());
}

function safeJsonParse(rawText) {
  try {
    return JSON.parse(rawText);
  } catch {
    return null;
  }
}

function isLikelyJsonContentType(contentType) {
  return contentType.includes("application/json");
}

function isRateLimitedCalendarResponse(statusCode, payload) {
  if (statusCode === 429) {
    return true;
  }

  if (statusCode !== 403) {
    return false;
  }

  const detail = `${getGoogleApiErrorReason(payload)} ${getGoogleApiErrorDetail(payload)}`.toLowerCase();
  return (
    detail.includes("ratelimit") ||
    detail.includes("rate limit") ||
    detail.includes("quota") ||
    detail.includes("resource_exhausted")
  );
}

function getGoogleApiErrorReason(payload) {
  return (
    payload?.error?.errors?.[0]?.reason ||
    payload?.error?.status ||
    ""
  );
}

function getGoogleApiErrorDetail(payload) {
  return (
    payload?.error?.message ||
    payload?.error?.errors?.[0]?.message ||
    ""
  );
}

function wait(durationMs) {
  if (backgroundTimer) {
    return backgroundTimer.wait(durationMs);
  }

  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function createBackgroundTimer() {
  if (
    typeof Worker === "undefined" ||
    typeof Blob === "undefined" ||
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    return null;
  }

  const workerSource = `
    const activeTimers = new Map();

    self.addEventListener("message", (event) => {
      const data = event.data || {};

      if (data.type === "wait") {
        const timerId = setTimeout(() => {
          activeTimers.delete(data.id);
          self.postMessage({ type: "done", id: data.id });
        }, data.durationMs);

        activeTimers.set(data.id, timerId);
        return;
      }

      if (data.type === "cancel") {
        const timerId = activeTimers.get(data.id);

        if (timerId) {
          clearTimeout(timerId);
          activeTimers.delete(data.id);
        }
        return;
      }

      if (data.type === "dispose") {
        for (const timerId of activeTimers.values()) {
          clearTimeout(timerId);
        }

        activeTimers.clear();
        self.close();
      }
    });
  `;
  const workerUrl = URL.createObjectURL(
    new Blob([workerSource], { type: "text/javascript" }),
  );
  const worker = new Worker(workerUrl);
  const pendingResolves = new Map();
  let nextWaitId = 0;

  URL.revokeObjectURL(workerUrl);

  worker.addEventListener("message", (event) => {
    const data = event.data || {};

    if (data.type !== "done") {
      return;
    }

    const resolve = pendingResolves.get(data.id);

    if (!resolve) {
      return;
    }

    pendingResolves.delete(data.id);
    resolve();
  });

  window.addEventListener(
    "beforeunload",
    () => {
      worker.postMessage({ type: "dispose" });
      worker.terminate();
      pendingResolves.clear();
    },
    { once: true },
  );

  return {
    wait(durationMs) {
      return new Promise((resolve) => {
        const waitId = `wait_${nextWaitId}`;
        nextWaitId += 1;
        pendingResolves.set(waitId, resolve);
        worker.postMessage({
          type: "wait",
          id: waitId,
          durationMs,
        });
      });
    },
  };
}

function waitForGoogleIdentity(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function check() {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        resolve();
        return;
      }

      if (Date.now() - start > timeoutMs) {
        reject(
          new Error(
            "Google Identity Services did not load. Check your connection and try again.",
          ),
        );
        return;
      }

      window.setTimeout(check, 100);
    }

    check();
  });
}
