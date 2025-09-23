document.addEventListener('DOMContentLoaded', () => {
  const exportButton = /** @type {HTMLButtonElement} */ (
    document.getElementById('export-button')
  );
  const importButton = /** @type {HTMLButtonElement} */ (
    document.getElementById('import-button')
  );
  const importFile = /** @type {HTMLInputElement} */ (
    document.getElementById('import-file')
  );
  const deleteAllButton = /** @type {HTMLButtonElement} */ (
    document.getElementById('delete-all-button')
  );

  // Export functionality
  if (exportButton) {
    exportButton.addEventListener('click', () => {
      chrome.storage.sync.get('notes', (data) => {
        if (chrome.runtime.lastError) {
          alert('Error fetching notes: ' + chrome.runtime.lastError.message);
          return;
        }

        const notes = data.notes || {};
        if (Object.keys(notes).length === 0) {
          alert('There are no notes to export.');
          return;
        }

        const jsonString = JSON.stringify(notes, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace('T', '_')
          .replace(/:/g, '-');
        const filename = `sticky-notes-backup-${timestamp}.json`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('Notes exported successfully!');
      });
    });
  }

  // Import functionality
  if (importButton && importFile) {
    // When the import button is clicked, trigger the hidden file input
    importButton.addEventListener('click', () => {
      importFile.click();
    });

    // When a file is selected, start the import process
    importFile.addEventListener('change', () => {
      if ((importFile.files?.length ?? 0) <= 0) {
        return; // No file selected
      }

      const file = /** @type {FileList} */ (importFile.files)[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const result = event.target?.result;
          if (typeof result !== 'string') {
            throw new Error('Invalid file format.');
          }
          const importedNotes = JSON.parse(result);

          // Basic validation
          if (
            typeof importedNotes !== 'object' ||
            importedNotes === null ||
            Array.isArray(importedNotes)
          ) {
            throw new Error('Invalid file format.');
          }

          // Save the new notes to storage
          chrome.storage.sync.set({ notes: importedNotes }, () => {
            if (chrome.runtime.lastError) {
              alert(
                'Error importing notes: ' + chrome.runtime.lastError.message,
              );
            } else {
              alert(
                'Notes imported successfully! The changes will be visible on your pages.',
              );
            }
          });
        } catch (e) {
          alert('Error parsing JSON file: ' + e.message);
        } finally {
          // Reset file input to allow re-importing the same file
          importFile.value = '';
        }
      };

      reader.onerror = () => {
        alert('Error reading the file.');
        // Reset file input
        importFile.value = '';
      };

      reader.readAsText(file);
    });
  }

  // Delete all notes functionality
  if (deleteAllButton) {
    deleteAllButton.addEventListener('click', () => {
      // First check if there are any notes to delete
      chrome.storage.sync.get('notes', (data) => {
        if (chrome.runtime.lastError) {
          alert('Error checking notes: ' + chrome.runtime.lastError.message);
          return;
        }

        const notes = data.notes || {};
        if (Object.keys(notes).length === 0) {
          alert('There are no notes to delete.');
          return;
        }

        // Show confirmation dialog
        const noteCount = Object.keys(notes).length;
        const confirmMessage = `Are you sure you want to delete all ${noteCount} sticky note(s)? This action cannot be undone.`;

        if (confirm(confirmMessage)) {
          // Clear all notes from storage
          chrome.storage.sync.set({ notes: {} }, () => {
            if (chrome.runtime.lastError) {
              alert(
                'Error deleting notes: ' + chrome.runtime.lastError.message,
              );
            } else {
              alert('All sticky notes have been deleted successfully!');
            }
          });
        }
      });
    });
  }
});
