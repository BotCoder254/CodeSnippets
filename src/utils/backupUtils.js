import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export const exportSnippets = async (userId) => {
  try {
    const snippetsRef = collection(db, 'snippets');
    const q = query(snippetsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const snippets = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get versions for each snippet
    for (const snippet of snippets) {
      const versionsRef = collection(db, `snippets/${snippet.id}/versions`);
      const versionsSnapshot = await getDocs(versionsRef);
      snippet.versions = versionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      snippets,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `snippets_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting snippets:', error);
    throw error;
  }
};

export const importSnippets = async (file, userId) => {
  try {
    const fileContent = await file.text();
    const importData = JSON.parse(fileContent);

    if (!importData.version || !importData.snippets) {
      throw new Error('Invalid backup file format');
    }

    const results = {
      total: importData.snippets.length,
      imported: 0,
      failed: 0,
      errors: [],
    };

    for (const snippet of importData.snippets) {
      try {
        // Prepare snippet data
        const snippetData = {
          title: snippet.title,
          description: snippet.description,
          code: snippet.code,
          language: snippet.language,
          tags: snippet.tags || [],
          subCategory: snippet.subCategory || '',
          isPublic: false, // Default to private for imported snippets
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Create new snippet
        const snippetsCollection = collection(db, 'snippets');
        const docRef = await addDoc(snippetsCollection, snippetData);

        // Import versions if they exist
        if (snippet.versions && snippet.versions.length > 0) {
          const versionsRef = collection(db, `snippets/${docRef.id}/versions`);
          for (const version of snippet.versions) {
            await addDoc(versionsRef, {
              ...version,
              userId,
              createdAt: new Date().toISOString(),
            });
          }
        }

        results.imported++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          snippet: snippet.title,
          error: error.message,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error importing snippets:', error);
    throw error;
  }
};

export const exportAsPlainText = async (userId) => {
  try {
    const snippetsRef = collection(db, 'snippets');
    const q = query(snippetsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    let textContent = '';
    const snippets = querySnapshot.docs.map(doc => doc.data());

    for (const snippet of snippets) {
      textContent += `Title: ${snippet.title}\n`;
      textContent += `Language: ${snippet.language}\n`;
      textContent += `Tags: ${snippet.tags.join(', ')}\n`;
      if (snippet.subCategory) {
        textContent += `Category: ${snippet.subCategory}\n`;
      }
      textContent += `Description: ${snippet.description}\n`;
      textContent += 'Code:\n';
      textContent += '```' + snippet.language.toLowerCase() + '\n';
      textContent += snippet.code + '\n';
      textContent += '```\n\n';
      textContent += '-------------------\n\n';
    }

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `snippets_text_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting snippets as text:', error);
    throw error;
  }
}; 