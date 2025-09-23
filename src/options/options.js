document.addEventListener('DOMContentLoaded', () => {
  const exportButton = document.getElementById('export-button');
  const importFile = document.getElementById('import-file');
  const importButton = document.getElementById('import-button');

  // Export functionality
  if (exportButton) {
    exportButton.addEventListener('click', () => {
      chrome.storage.local.get('notes', (data) => {
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
    importButton.addEventListener('click', () => {
      if (importFile.files.length === 0) {
        alert('Please select a file to import.');
        return;
      }

      const file = importFile.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const importedNotes = JSON.parse(event.target.result);

          // Basic validation: check if it's a non-null object
          if (
            typeof importedNotes !== 'object' ||
            importedNotes === null ||
            Array.isArray(importedNotes)
          ) {
            throw new Error('Invalid file format.');
          }

          // Overwrite existing notes with the imported ones
          chrome.storage.local.set({ notes: importedNotes }, () => {
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
        }
      };

      reader.onerror = () => {
        alert('Error reading the file.');
      };

      reader.readAsText(file);
    });
  }
});
