function countRows(v) {
    if (Array.isArray(v))
        return Math.max(1, v.reduce((sum, item) => sum + countRows(item), 0));
    if (v !== null && typeof v === 'object')
        return Math.max(1, Object.values(v).reduce((sum, child) => sum + countRows(child), 0));
    return 1;
}

function esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Encode a path array into a safe id/url param string
function pathToId(path) {
    return path.map(encodeURIComponent).join('/');
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

function buildNode(v, path) {
    if (Array.isArray(v))
        return v.length
            ? buildChildren(v.map((item, i) => [String(i), item]), path, true)
            : { firstRow: '<td></td>', extraRows: '' };
    if (v !== null && typeof v === 'object')
        return Object.keys(v).length
            ? buildChildren(Object.entries(v), path)
            : { firstRow: '<td></td>', extraRows: '' };
    if (typeof v === 'string' && IMAGE_EXT.test(v)) {
        return {
            firstRow: `<td><img src="static/assets/${esc(v)}" alt="${esc(v)}"></td>`,
            extraRows: '',
        };
    }

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (typeof v === 'string' && EMAIL_RE.test(v)) {
        return {
            firstRow: `<td class="value" data-path="${pathToId(path)}"><a href="mailto:${esc(v)}">${esc(v)}</a></td>`,
            extraRows: '',
        };
    }

    const URL_RE = /^https?:\/\//i;

    if (typeof v === 'string' && URL_RE.test(v)) {
        return {
            firstRow: `<td class="value" data-path="${pathToId(path)}"><a href="${esc(v)}" target="_blank" rel="noopener">${esc(v)}</a></td>`,
            extraRows: '',
        };
    }

    return {
        firstRow: `<td class="value" data-path="${pathToId(path)}"><a href="https://www.google.com/search?q=${encodeURIComponent(v === null ? 'null' : String(v))}" target="_blank" rel="noopener">${v === null ? 'null' : esc(String(v))}</a></td>`,
        extraRows: '',
    };
}

function buildChildren(entries, path, isList = false) {
    let firstRow = '', extraRows = '', isFirst = true;
    for (const [k, v] of entries) {
        const cellPath = [...path, k];
        const id = pathToId(cellPath);
        const span = countRows(v);
        const keyLabel = IMAGE_EXT.test(k)
            ? `<img src="static/assets/${esc(k)}" alt="${esc(k)}">`
            : esc(k);
        const keyTd = isList ? '' : `<td rowspan="${span}" id="${id}" data-path="${id}" onclick="jsonTableCellClick(this)" onmouseenter="jsonTableHover(this)" onmouseleave="jsonTableHoverOut()">${keyLabel}</td>`;
        const child = buildNode(v, cellPath);
        if (isFirst) {
            firstRow += keyTd + child.firstRow;
            extraRows += child.extraRows;
            isFirst = false;
        } else {
            extraRows += `<tr>${keyTd}${child.firstRow}</tr>${child.extraRows}`;
        }
    }
    return { firstRow, extraRows };
}

function jsonToTable(obj) {
    const { firstRow, extraRows } = buildChildren(Object.entries(obj), []);
    return `<table>\n<tr>${firstRow}</tr>\n${extraRows}</table>`;
}

// Call once after inserting the table into the DOM.
// Reads ?cell= from the URL and scrolls to that cell.
function jsonTableInit(firstKey, paramName = 'cell') {
    const params = new URLSearchParams(window.location.search);
    const target = params.get(paramName);
    if (target) requestAnimationFrame(() => scrollToCell(encodeURIComponent(firstKey) + '/' + target));
}

function jsonTableCellClick(el, paramName = 'cell') {
    const path = el.dataset.path;
    const paramPath = path.split('/').slice(1).join('/');
    const params = new URLSearchParams(window.location.search);
    params.set(paramName, paramPath);
    const url = window.location.origin + window.location.pathname + '?' + params.toString();
    history.replaceState(null, '', url);
    navigator.clipboard.writeText(url);
    scrollToCell(path);
}

function scrollToCell(path) {
    const el = document.getElementById(path);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    window.scrollBy({
        top: rect.top - 50,
        left: rect.left - 50,
        behavior: 'smooth',
    });
}

function jsonTableHover(el) {
    const path = el.dataset.path;
    document.querySelectorAll('[data-path]').forEach(td => {
        const isChild = td.dataset.path === path || td.dataset.path.startsWith(path + '/');
        td.classList.toggle('hover', isChild);
    });
}

function jsonTableHoverOut() {
    document.querySelectorAll('[data-path]').forEach(td => td.classList.remove('hover'));
}