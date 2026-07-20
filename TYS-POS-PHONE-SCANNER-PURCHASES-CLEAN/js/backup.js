//======================================================
// TYS POS v3
// BACKUP & RESTORE MODULE
//======================================================

function downloadBackup() {
    const backup = exportDatabase();

    downloadJSON(
        `tys-pos-backup-${new Date().toISOString().slice(0, 10)}.json`,
        backup
    );
}

async function restoreBackup() {
    const fileInput = document.getElementById("restore-backup-file");

    if (!fileInput || !fileInput.files.length) {
        alert("Please choose a backup file.");
        return;
    }

    if (!confirm("Restore backup? This will replace current POS data.")) {
        return;
    }

    try {
        const data = await readJSON(fileInput.files[0]);

        const ok = importDatabase(data);

        if (!ok) {
            alert("Invalid backup file.");
            return;
        }

        alert("Backup restored successfully.");

        location.reload();

    } catch (error) {
        console.error(error);
        alert("Could not restore backup.");
    }
}

function resetPOSDatabase() {
    if (!confirm("Delete ALL POS data? This cannot be undone.")) {
        return;
    }

    resetDatabase();

    alert("Database reset.");

    location.reload();
}

function initializeBackupModule() {
    const exportBtn = document.getElementById("export-backup-btn");
    const restoreBtn = document.getElementById("restore-backup-btn");
    const resetBtn = document.getElementById("reset-database-btn");

    if (exportBtn) {
        exportBtn.addEventListener("click", downloadBackup);
    }

    if (restoreBtn) {
        restoreBtn.addEventListener("click", restoreBackup);
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", resetPOSDatabase);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initializeBackupModule();
});
function downloadJSON(filename, data) {
    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

function readJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = event => {
            try {
                resolve(JSON.parse(event.target.result));
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = reject;

        reader.readAsText(file);
    });
}