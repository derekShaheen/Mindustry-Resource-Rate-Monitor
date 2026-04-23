let diffs = {};
const historyTimeSpan = 1; // Time in seconds over which to check changes
const rebuildInterval = 200; // ms between UI rebuilds (~5/sec)
const showThreshold = 5; // Show resources with at least this many items
const hideThreshold = 0; // Hide resources when they drop to this or below
const flickerWindow = 3000; // ms - if a resource reappears within this window, treat as flickering

let contentTable;
let coreItemsCollapser;

let isInjected = false;
let injectTimer;
let lastRebuildTime = 0;

const columnOptions = [4, 5, 6, 7, 8];
let columnIndex = 0;
let visibleResourceCount = 0;

Events.on(ClientLoadEvent, () => {
    contentTable = new Table(Styles.black6);
    contentTable.touchable = Touchable.enabled;
    contentTable.pack();

    coreItemsCollapser = Vars.ui.hudGroup.find('coreinfo').getChildren().get(1).getChildren().get(0);

    diffs = {};
    isInjected = false;

    // Cancel any previous timer before scheduling a new one
    if (injectTimer) injectTimer.cancel();

    injectTimer = Timer.schedule(() => {
        if (!isInjected) {
            injectTable();
        } else {
            injectTimer.cancel();
            injectTimer = null;
        }
    }, 0, 3);
});

Events.on(WorldLoadEvent, () => {
    diffs = {};
    isInjected = false;
    lastRebuildTime = 0;

    // Re-start injection polling in case UI was rebuilt between maps
    if (injectTimer) injectTimer.cancel();
    injectTimer = Timer.schedule(() => {
        if (!isInjected) {
            injectTable();
        } else {
            injectTimer.cancel();
            injectTimer = null;
        }
    }, 0, 3);
});

Events.run(Trigger.update, () => {
    if (isInjected) {
        const now = Time.millis();
        if (now - lastRebuildTime >= rebuildInterval) {
            rebuildTable();
            lastRebuildTime = now;
        }
    }
});

function injectTable() {
    if (!isInjected) {
        const resourceTable = createTable(contentTable);
        isInjected = true;
        coreItemsCollapser.setTable(resourceTable);
    }
}

function createTable(table) {
    const tableW = new Table();
    tableW.touchable = Touchable.enabled;
    tableW.add(table);
    tableW.row();

    // Cycle column count on click, reset to 4 if next option exceeds visible resources
    tableW.clicked(() => {
        const nextIndex = (columnIndex + 1) % columnOptions.length;
        if (columnOptions[nextIndex] > visibleResourceCount) {
            columnIndex = 0;
        } else {
            columnIndex = nextIndex;
        }
    });

    return tableW;
}

function rebuildTable() {
    contentTable.clearChildren();
    buildTable();
}

function buildTable() {
    const resourcesTable = contentTable.table().get();
    const currentItems = Vars.player.team().items();
    const activeItems = {};
    let i = 0;

    currentItems.each((item, amount) => {
        if (!diffs[item]) {
            diffs[item] = {
                lastAmount: amount,
                lastTimestamp: Time.millis(),
                displayValue: 0,
                visible: false,
                flickering: false,
                lastSeenBelow: 0 // Last time we saw this resource below showThreshold but > 0
            };
        }

        let diff = diffs[item];
        const currentTime = Time.millis();

        // Detect flickering: resource keeps appearing below threshold
        if (amount > 0 && amount < showThreshold) {
            if (diff.lastSeenBelow > 0 && currentTime - diff.lastSeenBelow < flickerWindow) {
                // Seen below threshold again recently — it's flickering
                diff.flickering = true;
            }
            diff.lastSeenBelow = currentTime;
        } else if (amount >= showThreshold) {
            // Solidly above threshold — stop flickering state
            diff.flickering = false;
            diff.lastSeenBelow = 0;
        }

        // Decide visibility
        if (diff.flickering) {
            // Flickering resources always show
            diff.visible = true;
        } else if (amount >= showThreshold) {
            diff.visible = true;
        } else if (amount <= hideThreshold) {
            diff.visible = false;
        }
        // If between hideThreshold and showThreshold and not flickering,
        // keep previous visible state (hysteresis)

        if (!diff.visible) return;

        activeItems[item] = true;

        // Calculate and update the display value only once per time span
        if (currentTime - diff.lastTimestamp >= 1000 * historyTimeSpan) {
            diff.displayValue = amount - diff.lastAmount;
            diff.lastAmount = amount;
            diff.lastTimestamp = currentTime;
        }

        const difference = diff.displayValue;
        let color = '[white]';
        let sign = '+';

        if (diff.flickering) {
            color = '[yellow]';
            sign = '~';
        } else if (difference > 0) {
            color = '[#8585FF]';
        } else if (difference < 0) {
            color = '[red]';
            sign = '-';
        }

        // Low-stock warning: losing resources and <10 seconds of supply left
        let amountColor = '[white]';
        if (!diff.flickering && difference < 0 && amount / Math.abs(difference) <= 10) {
            amountColor = '[red](!) ';
        }

        const displayDiff = diff.flickering
            ? sign + padNumber(0)
            : sign + padNumber(Math.abs(difference));

        resourcesTable.image(item.uiIcon).left();
        resourcesTable.label(() => amountColor + numberToString(amount) + '[white]').padLeft(2).left().padRight(1);
        resourcesTable.label(() => '(' + color + displayDiff + '[white])').left().padRight(2);

        if (++i % columnOptions[columnIndex] == 0) {
            resourcesTable.row();
        }
    });

    // Prune stale entries that are no longer in the current item set
    for (let key in diffs) {
        if (!activeItems[key]) {
            // Keep flickering entries alive until the window expires
            if (diffs[key].flickering && Time.millis() - diffs[key].lastSeenBelow < flickerWindow) {
                continue;
            }
            delete diffs[key];
        }
    }

    // Track visible count for column cycling
    visibleResourceCount = i;

    contentTable.row();
}

function padNumber(num) {
    return num.toString().padStart(2, '0');
}

function numberToString(num) {
    if (num < 0) return '-' + numberToString(Math.abs(num));
    if (num < 1000) return num.toString();

    const units = ['k', 'M', 'B', 'T'];
    const order = Math.min(Math.floor(Math.log10(num) / 3), units.length);
    const unitname = units[order - 1];
    const numStr = (num / Math.pow(1000, order)).toPrecision(3);

    return numStr + unitname;
}