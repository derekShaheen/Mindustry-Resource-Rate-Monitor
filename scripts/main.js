let diffs = {};
const historyTimeSpan = 1; // Time in seconds over which to check changes

let contentTable;
let coreItemsCollapser;

let isReplaced = false;
let booted = false;

Events.on(ClientLoadEvent, () => {
    contentTable = new Table(Styles.black6);
    contentTable.pack();

    coreItemsCollapser = Vars.ui.hudGroup.find('coreinfo').getChildren().get(1).getChildren().get(0);
    // Reset diffs when client loads to avoid data persisting between sessions
    diffs = {};

    Timer.schedule(update, 0, 3); // Check for UI replacement every 3 seconds
});

Events.on(WorldLoadEvent, () => {
    // Reset diffs when a new world is loaded to ensure clean data
    diffs = {};
});

Events.run(Trigger.update, () => {
    if (isReplaced) {
        rebuildTable();
    }
});

function createTable(table) {
    const tableW = new Table();
    tableW.add(table);
    tableW.row();
    return tableW;
}

function update() {
    if (!isReplaced || !booted) {
        const resourceTable = createTable(contentTable);
        isReplaced = true;
        booted = true;
        coreItemsCollapser.setTable(resourceTable);
    }
}

function rebuildTable() {
    clearTable();
    buildTable();
}

function buildTable() {
    const resourcesTable = contentTable.table().get();
    const currentItems = Vars.player.team().items();
    let i = 0;

    currentItems.each((item, amount) => {
        // Only show resources with more than 5 items so the screen doesn't flash
        if (amount < 5) return;

        if (!diffs[item]) {
            diffs[item] = { lastAmount: amount, lastTimestamp: Time.millis(), displayValue: 0 };
        }

        let diff = diffs[item];
        const currentTime = Time.millis();

        // Calculate and update the display value only once per time span
        if (currentTime - diff.lastTimestamp >= 1000 * historyTimeSpan) {
            diff.displayValue = amount - diff.lastAmount;
            diff.lastAmount = amount; // Update lastAmount to the current amount
            diff.lastTimestamp = currentTime; // Update the timestamp
        }

        const difference = diff.displayValue;
        let color = '[white]';
        let sign = '+';

        if (difference > 0) {
            color = '[green]';
            sign = '+';
        } else if (difference < 0) {
            color = '[red]';
            sign = '-';
        }

        resourcesTable.image(item.uiIcon).left();
        resourcesTable.label(() => numberToString(amount)).padLeft(2).left().padRight(1);
        resourcesTable.label(() => "(" + color + sign + padNumber(Math.abs(difference)) + "[white])").left().padRight(2);

        if (++i % 4 == 0) {
            resourcesTable.row();
        }
    });

    contentTable.row();
}

function padNumber(num) {
    return num.toString().padStart(2, '0');
}

function clearTable() {
    contentTable.clearChildren();
}

function numberToString(num) {
    if (num < 1000) {
        return num.toString();
    }

    const units = ['k', 'M', 'B', 'T'];
    const order = Math.floor(Math.log10(num) / 3);
    const unitname = units[order - 1];
    const numStr = (num / Math.pow(1000, order)).toPrecision(3);

    return numStr + unitname;
}

