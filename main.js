const STORAGE_KEY = 'compara-objects';

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
    list: document.querySelector('#objects-list'),
    openButton: document.querySelector('#open-object-dialog'),
    closeButton: document.querySelector('#close-btn'),
    cancelButton: document.querySelector('#cancel-object'),
};

let objects = loadObjects();
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

function renderObjects() {
    elements.list.replaceChildren();

    if (objects.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'No objects yet. Select "Add" to create one.';
        elements.list.append(emptyState);
        return;
    }

    objects.forEach((object) => {
        const card = document.createElement('article');
        card.className = 'mini-card';

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

    if (!object || !window.confirm(`Delete "${object.name}"?`)) {
        return;
    }

    objects = objects.filter((item) => item.id !== id);
    saveObjects();
    renderObjects();
}

elements.openButton.addEventListener('click', () => openDialog());
elements.closeButton.addEventListener('click', closeDialog);
elements.cancelButton.addEventListener('click', closeDialog);

elements.dialog.addEventListener('click', (event) => {
    if (event.target === elements.dialog) {
        closeDialog();
    }
});

elements.form.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = elements.name.value.trim();
    const content = elements.content.value.trim();

    if (!name || !content) {
        return;
    }

    try {
        JSON.parse(content);
    } catch {
        window.alert('Content must be valid JSON.');
        elements.content.focus();
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
    closeDialog();
});

renderObjects();