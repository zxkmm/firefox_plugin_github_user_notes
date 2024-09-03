const KeyType = {
  USERNAME: "USERNAME",
  USERID: "USERID",
};

const getUserIdWithApi = async (_userName_) => {
  //TODO figure out why sometimes githun 404. this issue should be from gh not me. disable for now
  // try {
  //   const response = await fetch(`https://api.github.com/users/${userName}`);
  //   const data = await response.json();
  //   console.log(data.id);
  // return data.id;
  // } catch (error) {
  //   console.error("Error fetching user ID:", error);
  //   return null;
  // }
  return null;
};

const getUserNotes = async (_keyType_, _key_) => {
  const storageKey =
    _keyType_ === KeyType.USERNAME
      ? `notes_username_${_key_}`
      : `notes_id_${_key_}`;
  const result = await browser.storage.sync.get(storageKey);
  return result[storageKey] || "";
};

const addOrEditNotesForUserAndId = async (_userName_, _userId_, _notes_) => {
  const promises = [];
  if (_userName_) {
    promises.push(
      browser.storage.sync.set({ [`notes_username_${_userName_}`]: _notes_ }),
    );
  }
  if (_userId_) {
    promises.push(
      browser.storage.sync.set({ [`notes_id_${_userId_}`]: _notes_ }),
    );
  }
  await Promise.all(promises);
};

const deleteUserNotes = async (_userName_, _userId_) => {
  const promises = [];
  if (_userName_) {
    promises.push(browser.storage.sync.remove(`notes_username_${_userName_}`));
  }
  if (_userId_) {
    promises.push(browser.storage.sync.remove(`notes_id_${_userId_}`));
  }
  await Promise.all(promises);
};

browser.runtime.onMessage.addListener((_request_, _sender_, _sendResponse_) => {
  switch (_request_.action) {
    case "getUserNotes":
      getUserNotes(KeyType.USERNAME, _request_.userName).then((notes) => {
        _sendResponse_({ notes: notes });
      });
      return true;

    case "addOrEditNotes":
      addOrEditNotesForUserAndId(
        _request_.userName,
        null,
        _request_.notes,
      ).then(() => {
        _sendResponse_({ success: true });
      });
      return true;

    case "deleteUserNotes":
      deleteUserNotes(_request_.userName, null).then(() => {
        _sendResponse_({ success: true });
      });
      return true;
  }
});
