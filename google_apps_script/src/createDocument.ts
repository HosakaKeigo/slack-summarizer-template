/**
 * Googleドキュメント作成。リンクを知っている全員に閲覧権限
 */
function createDocument(summary: Summary) {
  const doc = DocumentApp.create(summary.title)
  const docBody = doc.getBody()
  docBody.setText(summary.body)

  const fileId = doc.getId()
  const docFile = DriveApp.getFileById(fileId)
  moveDocument(docFile)
  docFile.setSharing(FILE_PERMISSION, FILE_PERMISSION_TYPE);

  console.log('Document created:' + summary.title)

  return doc
}

function moveDocument(file: GoogleAppsScript.Drive.File) {
  const destinationFolder = createNestedFolder(DIRECTORY_PATH);
  file.moveTo(destinationFolder);
}

function createNestedFolder(path: string): GoogleAppsScript.Drive.Folder {
  const folders = path.split('/');
  let parent = DriveApp.getRootFolder();

  for (var i = 0; i < folders.length; i++) {
    const nextFolder = getOrCreateFolder(parent, folders[i]);
    parent = nextFolder;
  }

  return parent;
}

function appendToDocument(content: string, doc: GoogleAppsScript.Document.Document) {
  const docBody = doc.getBody()
  docBody.appendPageBreak()
  docBody.appendParagraph(content)
  console.log("Document appended: " + content)
}

function getOrCreateFolder(parent: GoogleAppsScript.Drive.Folder, folderName: string) {
  const folders = parent.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parent.createFolder(folderName);
  }
}
