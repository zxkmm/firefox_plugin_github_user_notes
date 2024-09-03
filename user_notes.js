const KeyType = {
  USERNAME: "USERNAME",
  USERID: "USERID",
};

const isGitHubUserPage = () => {
  var regexTestResult = false;
  var elementTestResult = false;

  const currentURL = window.location.href;
  const gitHubUserPageRegex = /^https:\/\/github\.com\/[^/]+\/?$/;
  regexTestResult = gitHubUserPageRegex.test(currentURL);

  console.log("is user pge?", regexTestResult);
  return regexTestResult;
};

const getUserName = () => {
  const currentURL = window.location.href;
  const match = currentURL.match(/^https:\/\/github\.com\/([^/?]+)/);
  const userName = match ? match[1] : null;
  console.log("username", userName);
  return userName;
};

const getUserIdWithApi = async (userName) => {
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

const addOrEditHoverText = (notes) => {
  // remove in case if it exist so behavior like edit
  const existingHoverText = document.getElementById("hoverText");

  if (existingHoverText) {
    existingHoverText.remove();
  }

  const hoverText = document.createElement("div");
  hoverText.id = "hoverText";
  hoverText.textContent = notes;

  ///v inline style
  hoverText.style.position = "fixed";
  hoverText.style.left = "20px";
  hoverText.style.bottom = "20px";
  hoverText.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
  hoverText.style.color = "rgba(255, 255, 255, 0.5)";
  hoverText.style.padding = "10px";
  hoverText.style.borderRadius = "5px";
  hoverText.style.zIndex = "9999";
  hoverText.style.whiteSpace = "pre-wrap";
  hoverText.style.transition = "background-color 0.3s ease, color 0.3s ease";
  ///^ inline style

  hoverText.addEventListener("mouseenter", () => {
    hoverText.style.color = "rgba(255, 255, 255, 1)";
    hoverText.style.backgroundColor = "rgba(0, 0, 0, 1)";
  });

  hoverText.addEventListener("mouseleave", () => {
    hoverText.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
    hoverText.style.color = "rgba(255, 255, 255, 0.5)";
  });

  document.body.appendChild(hoverText);
};

const addOrEditNotesForUserAndId = async (userName, userId, notes) => {
  if (!userName && !userId) {
    return false;
  }

  const promises = [];

  if (userName) {
    promises.push(
      browser.storage.sync.set({ [`notes_username_${userName}`]: notes }),
    );
  }

  if (userId) {
    promises.push(browser.storage.sync.set({ [`notes_id_${userId}`]: notes }));
  }

  await Promise.all(promises);
  return true;
};

const deleteUserNotes = (userName, userId) => {
  const promises = [];
  if (userName) {
    promises.push(browser.storage.sync.remove(`notes_username_${userName}`));
  }
  if (userId) {
    promises.push(browser.storage.sync.remove(`notes_id_${userId}`));
  }
  return Promise.all(promises);
};

const getUserIdFromUserNotes = async (userName) => {
  const userId = await getUserIdWithApi(userName);
  return userId;
};

const getUserNotes = async (keyType, key) => {
  if (keyType !== KeyType.USERNAME && keyType !== KeyType.USERID) {
    throw new Error("Invalid keyType. Must be USERNAME or USERID.");
  }

  const storageKey =
    keyType === KeyType.USERNAME ? `notes_username_${key}` : `notes_id_${key}`;
  const result = await browser.storage.sync.get(storageKey);
  return result[storageKey] || "";
};

const notesProcessor = async (userNameNotes, userIdNotes) => {
  conflictHintText =
    "WARNING: Got different notes from this user's two identifiers.\n" +
    "This is probably because this user changed their username since you took last note,\n" +
    "or GitHub API return the ID failed.\n\n" +
    "The notes from username is: ";
  conflictHintTextConnector = "\n\nThe notes from user ID is: ";
  if (userNameNotes === userIdNotes) {
    return userNameNotes;
  } else if (userNameNotes != userIdNotes) {
    return userNameNotes;
    // conflictHintText + userNameNotes + conflictHintTextConnector + userIdNotes //idk why but sometimes github return 404
  }
};

const addButton = (text, onClick) => {
  const button = document.createElement("button");
  ///v inline style
  button.textContent = text;
  button.style.margin = "0 10px";
  button.style.padding = "5px 10px";
  button.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
  button.style.border = "1px solid #d1d5da";
  button.style.borderRadius = "10px";
  button.style.cursor = "pointer";
  button.style.color = "rgba(255, 255, 255, 0.5)";
  button.style.transition = "background-color 0.3s ease, color 0.3s ease";
  ///^ inline style
  button.addEventListener("mouseenter", () => {
    button.style.backgroundColor = "rgba(0, 0, 0, 1)";
    button.style.color = "rgba(255, 255, 255, 1)";
  });

  button.addEventListener("mouseleave", () => {
    button.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
    button.style.color = "rgba(255, 255, 255, 0.5)";
  });

  button.addEventListener("click", onClick);
  return button;
};

if (isGitHubUserPage()) {
  (async () => {
    const userName = getUserName();
    console.log("un,", userName);

    const userNameNotes = await getUserNotes(KeyType.USERNAME, userName);
    console.log("un note,", userNameNotes);

    if (userNameNotes) {
      addOrEditHoverText(userNameNotes);
      console.log("only username：", userNameNotes);
    }

    const userId = await getUserIdFromUserNotes(userName);
    console.log("id,", userId);

    const userIdNotes = await getUserNotes(KeyType.USERID, userId);
    console.log("id note", userIdNotes);

    const notes = await notesProcessor(userNameNotes, userIdNotes);
    console.log("processor result,", notes);

    if (notes) {
      addOrEditHoverText(notes);
      console.log("note：", notes);
    } else {
      console.log("add note");
      await addOrEditNotesForUserAndId(userName, userId, "test info");
    }

    const buttonContainer = document.createElement("div");
    buttonContainer.style.position = "fixed";
    buttonContainer.style.bottom = "20px";
    buttonContainer.style.right = "20px";
    buttonContainer.style.zIndex = "9999";

    const deleteButton = addButton("Delete notes for " + userName, async () => {
      await deleteUserNotes(userName, userId);
      addOrEditHoverText("");
    });

    const addEditButton = addButton(
      "Add or edit notes for " + userName,
      async () => {
        const newNotes = prompt("Enter new notes for this user:");
        if (newNotes !== null) {
          await addOrEditNotesForUserAndId(userName, userId, newNotes);
          addOrEditHoverText(newNotes);
        }
      },
    );

    buttonContainer.appendChild(deleteButton);
    buttonContainer.appendChild(addEditButton);
    document.body.appendChild(buttonContainer);

    browser.storage.sync
      .get(null)
      .then((result) => {
        console.log("All data in sync storage: ", result);
      })
      .catch((error) => {
        console.error("Error getting all data: ", error);
      });
  })();
}
