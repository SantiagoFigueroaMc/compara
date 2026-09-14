const STORAGE_KEY = 'compara-objects';
const COMPARISON_STORAGE_KEY = 'compara-comparison';
const COMPARISON_SETS_STORAGE_KEY = 'compara-comparison-sets';
const COMPARISON_KEYS_STORAGE_KEY = 'compara-comparison-keys';

const icons = {
    edit: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.862 4.487Zm0 0L19.5 7.125" /></svg>',
    delete: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>',
};

const elements = {
    dialog: document.querySelector('#edit-object'),
    form: document.querySelector('#object-form'),
    title: document.querySelector('#dialog-title'),
    name: document.querySelector('#object-name'),
    content: document.querySelector('#object-content'),
    formatJsonButton: document.querySelector('#format-json'),
    list: document.querySelector('#objects-list'),
    filter: document.querySelector('#object-filter'),
    comparisonDropzone: document.querySelector('#comparison-dropzone'),
    comparisonKeySelector: document.querySelector('#comparison-key-selector'),
    setName: document.querySelector('#comparison-set-name'),
    saveSetButton: document.querySelector('#save-comparison-set'),
    setMenu: document.querySelector('#comparison-set-menu'),
    setMenuToggle: document.querySelector('#comparison-set-menu-toggle'),
    openButton: document.querySelector('#open-object-dialog'),
    closeButton: document.querySelector('#close-btn'),
    cancelButton: document.querySelector('#cancel-object'),
};

let objects = loadObjects();
let comparisonIds = loadComparisonIds();
let comparisonSets = loadComparisonSets();
let selectedComparisonKeys = loadComparisonKeys();
let selectedComparisonSetId = null;
let editingId = null;

function loadObjects() {
    const storedObjects = localStorage.getItem(STORAGE_KEY);

    if (!storedObjects) {
        return [];
    }

    try {
        const parsedObjects = JSON.parse(storedObjects);
        return Array.isArray(parsedObjects) ? parsedObjects : [];
    } catch {
        console.error(`Unable to read stored objects from "${STORAGE_KEY}".`);
        return [];
    }
}

function saveObjects() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(objects));
}

function loadComparisonIds() {
    const storedIds = localStorage.getItem(COMPARISON_STORAGE_KEY);

    if (!storedIds) {
        return [];
    }

    try {
        const parsedIds = JSON.parse(storedIds);
        return Array.isArray(parsedIds) ? parsedIds : [];
    } catch {
        console.error(`Unable to read stored comparison from "${COMPARISON_STORAGE_KEY}".`);
        return [];
    }
}

function saveComparisonIds() {
    localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(comparisonIds));
}

function loadComparisonKeys() {
    const storedKeys = localStorage.getItem(COMPARISON_KEYS_STORAGE_KEY);

    if (!storedKeys) {
        return null;
    }

    try {
        const parsedKeys = JSON.parse(storedKeys);
        return Array.isArray(parsedKeys) ? new Set(parsedKeys) : null;
    } catch {
        console.error(`Unable to read stored comparison keys from "${COMPARISON_KEYS_STORAGE_KEY}".`);
        return null;
    }
}

function saveComparisonKeys() {
    localStorage.setItem(
        COMPARISON_KEYS_STORAGE_KEY,
        JSON.stringify([...selectedComparisonKeys]),
    );
}

function loadComparisonSets() {
    const storedSets = localStorage.getItem(COMPARISON_SETS_STORAGE_KEY);

    if (!storedSets) {
        return [];
    }

    try {
        const parsedSets = JSON.parse(storedSets);
        return Array.isArray(parsedSets) ? parsedSets : [];
    } catch {
        console.error(`Unable to read comparison sets from "${COMPARISON_SETS_STORAGE_KEY}".`);
        return [];
    }
}

function saveComparisonSets() {
    localStorage.setItem(COMPARISON_SETS_STORAGE_KEY, JSON.stringify(comparisonSets));
}

function arraysMatch(first, second) {
    return first.length === second.length && first.every((value, index) => value === second[index]);
}

function hasComparisonSetChanges(savedSet) {
    return savedSet.name !== elements.setName.value.trim()
        || !arraysMatch(savedSet.objectIds, comparisonIds)
        || !arraysMatch(savedSet.keys ?? [], [...selectedComparisonKeys]);
}

function updateComparisonSetButton() {
    const selectedSet = comparisonSets.find((set) => set.id === selectedComparisonSetId);
    const isUpdate = selectedSet && hasComparisonSetChanges(selectedSet);
    elements.saveSetButton.textContent = isUpdate ? 'Update set' : 'Save set';
    elements.saveSetButton.dataset.mode = isUpdate ? 'update' : 'save';
}

function renderComparisonSetOptions() {
    elements.setMenu.replaceChildren();

    if (comparisonSets.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.className = 'set-menu-empty';
        emptyState.textContent = 'No saved sets.';
        elements.setMenu.append(emptyState);
        return;
    }

    comparisonSets.forEach((set) => {
        const option = document.createElement('div');
        option.className = 'set-menu__item';

        const loadButton = document.createElement('button');
        loadButton.type = 'button';
        loadButton.className = 'set-menu__load';
        loadButton.textContent = set.name;
        loadButton.addEventListener('click', () => loadComparisonSet(set.id));

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'set-menu__delete';
        deleteButton.setAttribute('aria-label', `Delete set ${set.name}`);
        deleteButton.title = 'Delete set';
        deleteButton.innerHTML = icons.delete;
        deleteButton.addEventListener('click', () => deleteComparisonSet(set.id));

        option.append(loadButton, deleteButton);
        elements.setMenu.append(option);
    });
}

function deleteComparisonSet(id) {
    const set = comparisonSets.find((item) => item.id === id);

    if (!set || !window.confirm(`Delete set "${set.name}"?`)) {
        return;
    }

    comparisonSets = comparisonSets.filter((item) => item.id !== id);
    saveComparisonSets();

    if (selectedComparisonSetId === id) {
        selectedComparisonSetId = null;
        elements.setName.value = '';
        updateComparisonSetButton();
    }

    elements.setMenu.hidden = true;
    elements.setMenuToggle.setAttribute('aria-expanded', 'false');
    renderComparisonSetOptions();
}

function renderComparisonKeySelector(keys) {
    elements.comparisonKeySelector.replaceChildren();

    if (keys.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.className = 'key-selector-empty';
        emptyState.textContent = 'No keys available.';
        elements.comparisonKeySelector.append(emptyState);
        return;
    }

    const title = document.createElement('h3');
    title.textContent = 'Keys to show';
    elements.comparisonKeySelector.append(title);

    const createKeyGroup = (groupTitle, groupKeys) => {
        if (groupKeys.length === 0) {
            return;
        }

        const group = document.createElement('section');
        group.className = 'key-selector__group';
        const heading = document.createElement('h4');
        heading.textContent = groupTitle;
        group.append(heading);

        groupKeys.forEach((key) => {
        const label = document.createElement('label');
        label.className = 'key-selector__option';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = selectedComparisonKeys.has(key);
        checkbox.addEventListener('change', () => {
            selectedComparisonKeys = new Set(
                [...elements.comparisonKeySelector.querySelectorAll('input:checked')]
                    .map((input) => input.value),
            );
            saveComparisonKeys();
            renderComparison();
            updateComparisonSetButton();
        });

        checkbox.value = key;
        label.append(checkbox, document.createTextNode(key));
            group.append(label);
        });

        elements.comparisonKeySelector.append(group);
    };

    createKeyGroup(
        'Active keys',
        keys.filter((key) => selectedComparisonKeys.has(key)),
    );
    createKeyGroup(
        'Other keys',
        keys.filter((key) => !selectedComparisonKeys.has(key)),
    );
}

function renderObjects() {
    elements.list.replaceChildren();

    const filter = elements.filter.value.trim().toLowerCase();
    const visibleObjects = objects.filter((object) => {
        const searchableContent = `${object.name} ${object.content}`.toLowerCase();
        return searchableContent.includes(filter);
    });

    if (visibleObjects.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state';
        emptyState.textContent = objects.length === 0
            ? 'No objects yet. Select "Add" to create one.'
            : 'No objects match the current filter.';
        elements.list.append(emptyState);
        return;
    }

    visibleObjects.forEach((object) => {
        const card = document.createElement('article');
        card.className = 'mini-card';
        card.draggable = true;
        card.dataset.objectId = object.id;
        card.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text/plain', object.id);
            event.dataTransfer.effectAllowed = 'copy';
        });

        const name = document.createElement('span');
        name.className = 'mini-card__name';
        name.textContent = object.name;

        const content = document.createElement('pre');
        content.className = 'mini-card__content';
        content.textContent = object.content;

        const actions = document.createElement('div');
        actions.className = 'mini-card__actions';

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'icon-button';
        editButton.setAttribute('aria-label', `Edit ${object.name}`);
        editButton.title = 'Edit';
        editButton.innerHTML = `${icons.edit}<span>Edit</span>`;
        editButton.addEventListener('click', () => openDialog(object));

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'icon-button';
        deleteButton.setAttribute('aria-label', `Delete ${object.name}`);
        deleteButton.title = 'Delete';
        deleteButton.innerHTML = `${icons.delete}<span>Delete</span>`;
        deleteButton.addEventListener('click', () => deleteObject(object.id));

        actions.append(editButton, deleteButton);
        card.append(name, content, actions);
        elements.list.append(card);
    });
}

function renderComparison() {
    elements.comparisonDropzone.replaceChildren();
    const comparedObjects = comparisonIds
        .map((id) => objects.find((object) => object.id === id))
        .filter(Boolean);

    if (comparedObjects.length === 0) {
        selectedComparisonKeys = new Set();
        renderComparisonKeySelector([]);
        const emptyState = document.createElement('p');
        emptyState.className = 'dropzone-empty';
        emptyState.textContent = 'Drag objects here to compare them.';
        elements.comparisonDropzone.append(emptyState);
        return;
    }

    const parsedObjects = comparedObjects.map((object) => {
        let parsedContent;
        try {
            parsedContent = JSON.parse(object.content);
        } catch {
            parsedContent = object.content;
        }
        return { object, content: parsedContent };
    });

    const valuesByKey = new Map();
    const objectContents = parsedObjects.filter(({ content }) =>
        content && typeof content === 'object' && !Array.isArray(content));

    if (objectContents.length > 0) {
        objectContents.forEach(({ object, content }) => {
            Object.entries(content).forEach(([key, value]) => {
                if (!valuesByKey.has(key)) valuesByKey.set(key, []);
                valuesByKey.get(key).push({ id: object.id, value });
            });
        });
    } else {
        valuesByKey.set('Value', parsedObjects.map(({ object, content }) => ({
            id: object.id,
            value: content,
        })));
    }

    const allKeys = [...valuesByKey.keys()].sort((keyA, keyB) => keyA.localeCompare(keyB));
    if (selectedComparisonKeys === null) {
        selectedComparisonKeys = new Set(allKeys);
    } else {
        selectedComparisonKeys = new Set(
            allKeys.filter((key) => selectedComparisonKeys.has(key)),
        );
    }
    renderComparisonKeySelector(allKeys);

    const table = document.createElement('table');
    table.className = 'comparison-table';
    const caption = document.createElement('caption');
    caption.className = 'visually-hidden';
    caption.textContent = 'Comparison of selected objects';
    table.append(caption);

    const head = table.createTHead().insertRow();
    const keyHeader = document.createElement('th');
    keyHeader.scope = 'col';
    keyHeader.textContent = 'Key';
    head.append(keyHeader);

    comparedObjects.forEach((object) => {
        const header = document.createElement('th');
        header.scope = 'col';
        header.textContent = object.name;
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-comparison';
        removeButton.type = 'button';
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => removeFromComparison(object.id));
        header.append(removeButton);
        head.append(header);
    });

    const body = table.createTBody();
    [...valuesByKey.entries()]
        .filter(([key]) => selectedComparisonKeys.has(key))
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .forEach(([key, values]) => {
        const row = body.insertRow();
        row.insertCell().textContent = key;
        comparedObjects.forEach((object) => {
            const cell = row.insertCell();
            const entry = values.find((item) => item.id === object.id);
            const code = document.createElement('code');
            code.textContent = entry ? formatValue(entry.value) : '—';
            cell.append(code);
        });
    });

    elements.comparisonDropzone.append(table);
}

function formatValue(value) {
    return typeof value === 'string' ? value : JSON.stringify(value);
}

function sortJsonKeys(value) {
    if (Array.isArray(value)) {
        return value.map(sortJsonKeys);
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value)
                .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                .map(([key, entryValue]) => [key, sortJsonKeys(entryValue)]),
        );
    }

    return value;
}

function removeFromComparison(id) {
    comparisonIds = comparisonIds.filter((comparisonId) => comparisonId !== id);
    saveComparisonIds();
    renderComparison();
    updateComparisonSetButton();
}

function saveComparisonSet() {
    const name = elements.setName.value.trim();

    if (!name) {
        elements.setName.focus();
        return;
    }

    const selectedSet = comparisonSets.find((set) => set.id === selectedComparisonSetId);
    if (selectedSet && hasComparisonSetChanges(selectedSet)) {
        selectedSet.name = name;
        selectedSet.objectIds = [...comparisonIds];
        selectedSet.keys = [...selectedComparisonKeys];
        saveComparisonSets();
        renderComparisonSetOptions();
        updateComparisonSetButton();
        return;
    }

    const savedSet = {
        id: crypto.randomUUID(),
        name,
        objectIds: [...comparisonIds],
        keys: [...selectedComparisonKeys],
    };

    comparisonSets.push(savedSet);
    saveComparisonSets();
    renderComparisonSetOptions();
    selectedComparisonSetId = savedSet.id;
    updateComparisonSetButton();
}

function loadComparisonSet(id) {
    if (!id) {
        selectedComparisonSetId = null;
        elements.setName.value = '';
        updateComparisonSetButton();
        return;
    }

    const savedSet = comparisonSets.find((set) => set.id === id);

    if (!savedSet) {
        return;
    }

    selectedComparisonSetId = savedSet.id;
    elements.setName.value = savedSet.name;
    comparisonIds = savedSet.objectIds.filter((objectId) =>
        objects.some((object) => object.id === objectId));
    selectedComparisonKeys = Array.isArray(savedSet.keys)
        ? new Set(savedSet.keys)
        : null;
    saveComparisonIds();
    renderComparison();
    updateComparisonSetButton();
    elements.setMenu.hidden = true;
    elements.setMenuToggle.setAttribute('aria-expanded', 'false');
}

function openDialog(object = null) {
    editingId = object?.id ?? null;
    elements.title.textContent = object ? 'Edit object' : 'Add object';
    elements.name.value = object?.name ?? '';
    elements.content.value = object?.content ?? '';
    elements.dialog.showModal();
    elements.name.focus();
}

function closeDialog() {
    elements.dialog.close();
    elements.form.reset();
    editingId = null;
}

function deleteObject(id) {
    const object = objects.find((item) => item.id === id);
    const selectedSet = comparisonSets.find((set) => set.id === selectedComparisonSetId);

    if (!object || !window.confirm(`Delete "${object.name}"?`)) {
        return;
    }

    objects = objects.filter((item) => item.id !== id);
    comparisonIds = comparisonIds.filter((comparisonId) => comparisonId !== id);
    comparisonSets = comparisonSets.map((set) => ({
        ...set,
        objectIds: set.objectIds.filter((objectId) => objectId !== id),
    }));
    saveObjects();
    saveComparisonIds();
    saveComparisonSets();
    if (selectedSet && selectedSet.objectIds.includes(id)) {
        selectedComparisonSetId = null;
        elements.setName.value = '';
    }
    renderObjects();
    renderComparisonSetOptions();
    renderComparison();
    updateComparisonSetButton();
}

elements.openButton.addEventListener('click', () => openDialog());
elements.filter.addEventListener('input', renderObjects);
elements.setName.addEventListener('input', updateComparisonSetButton);
elements.saveSetButton.addEventListener('click', saveComparisonSet);
elements.setMenuToggle.addEventListener('click', () => {
    elements.setMenu.hidden = !elements.setMenu.hidden;
    elements.setMenuToggle.setAttribute('aria-expanded', String(!elements.setMenu.hidden));
});
document.addEventListener('click', (event) => {
    if (!elements.setMenu.contains(event.target) &&
        !elements.setMenuToggle.contains(event.target)) {
        elements.setMenu.hidden = true;
        elements.setMenuToggle.setAttribute('aria-expanded', 'false');
    }
});
elements.formatJsonButton.addEventListener('click', () => {
    try {
        const parsedContent = JSON.parse(elements.content.value);
        const formattedContent = JSON.stringify(sortJsonKeys(parsedContent), null, 2);
        elements.content.value = formattedContent;
    } catch {
        window.alert('Content must be valid JSON before it can be formatted.');
        elements.content.focus();
    }
});
elements.closeButton.addEventListener('click', closeDialog);
elements.cancelButton.addEventListener('click', closeDialog);

elements.dialog.addEventListener('click', (event) => {
    if (event.target === elements.dialog) {
        closeDialog();
    }
});

elements.comparisonDropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    elements.comparisonDropzone.classList.add('is-dragging-over');
});

elements.comparisonDropzone.addEventListener('dragleave', (event) => {
    if (!elements.comparisonDropzone.contains(event.relatedTarget)) {
        elements.comparisonDropzone.classList.remove('is-dragging-over');
    }
});

elements.comparisonDropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    elements.comparisonDropzone.classList.remove('is-dragging-over');
    const id = event.dataTransfer.getData('text/plain');

    if (objects.some((object) => object.id === id) && !comparisonIds.includes(id)) {
        comparisonIds.push(id);
        if (selectedComparisonKeys?.size === 0) {
            selectedComparisonKeys = null;
        }
        saveComparisonIds();
        renderComparison();
        updateComparisonSetButton();
    }
});

elements.form.addEventListener('submit', (event) => {
    event.preventDefault();

    let name = elements.name.value.trim();
    const content = elements.content.value.trim();

    if (!content) {
        return;
    }

    let parsedContent;
    try {
        parsedContent = JSON.parse(content);
    } catch {
        window.alert('Content must be valid JSON.');
        elements.content.focus();
        return;
    }

    if (!name && parsedContent && typeof parsedContent === 'object' &&
        !Array.isArray(parsedContent) && typeof parsedContent.eventName === 'string') {
        name = parsedContent.eventName.trim();
    }

    if (!name) {
        window.alert('Enter a name or include a valid "eventName" in the JSON.');
        elements.name.focus();
        return;
    }

    if (editingId) {
        const object = objects.find((item) => item.id === editingId);
        if (object) {
            object.name = name;
            object.content = content;
        }
    } else {
        objects.push({
            id: crypto.randomUUID(),
            name,
            content,
        });
    }

    saveObjects();
    renderObjects();
    comparisonIds = comparisonIds.filter((id) => objects.some((object) => object.id === id));
    saveComparisonIds();
    comparisonSets = comparisonSets.map((set) => ({
        ...set,
        objectIds: set.objectIds.filter((id) => objects.some((object) => object.id === id)),
    }));
    saveComparisonSets();
    renderComparisonSetOptions();
    renderComparison();
    updateComparisonSetButton();
    closeDialog();
});

renderObjects();
renderComparisonSetOptions();
renderComparison();
updateComparisonSetButton();