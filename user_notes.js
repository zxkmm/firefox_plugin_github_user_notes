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

const createButtonContainer = () => {
  const buttonContainer = document.createElement("div");
  buttonContainer.style.position = "fixed";
  buttonContainer.style.bottom = "20px";
  buttonContainer.style.right = "20px";
  buttonContainer.style.zIndex = "9999";
  return buttonContainer;
};

const addOrEditHoverText = (_notes_) => {
  // remove in case if it exist so behavior like edit. after refactor it should be not needed but just in case since it's not harmful anyways
  const existingHoverText = document.getElementById("hoverText");

  if (existingHoverText) {
    existingHoverText.remove();
  }

  const hoverText = document.createElement("div");
  hoverText.id = "hoverText";
  hoverText.textContent = _notes_;

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

const notesProcessor = async (_userNameNotes_, _userIdNotes_) => {
  conflictHintText =
    "WARNING: Got different notes from this user's two identifiers.\n" +
    "This is probably because this user changed their username since you took last note,\n" +
    "or GitHub API return the ID failed.\n\n" +
    "The notes from username is: ";
  conflictHintTextConnector = "\n\nThe notes from user ID is: ";
  if (_userNameNotes_ === _userIdNotes_) {
    return _userNameNotes_;
  } else if (_userNameNotes_ != _userIdNotes_) {
    return _userNameNotes_;
    // conflictHintText + userNameNotes + conflictHintTextConnector + userIdNotes //idk why but sometimes github return 404, disable for now
  }
};

const addButton = (_text_, _onClick_) => {
  const button = document.createElement("button");
  ///v inline style
  button.textContent = _text_;
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

  button.addEventListener("click", _onClick_);
  return button;
};

const removeExistingElements = () => {
  const existingHoverText = document.getElementById("hoverText");
  if (existingHoverText) existingHoverText.remove();

  const existingButtonContainer = document.querySelector(
    "div[style*='position: fixed'][style*='bottom: 20px'][style*='right: 20px']",
  );
  if (existingButtonContainer) existingButtonContainer.remove();
};

const handleGitHubUserPage = async () => {
  removeExistingElements();
  const userName = getUserName();

  browser.runtime.sendMessage(
    {
      action: "getUserNotes",
      userName: userName,
    },
    (response) => {
      if (response.notes) {
        addOrEditHoverText(response.notes);
      }

      const buttonContainer = createButtonContainer();

      if (response.notes) {
        const deleteButton = addButton("Delete notes for " + userName, () => {
          browser.runtime.sendMessage({
            action: "deleteUserNotes",
            userName: userName,
          });
          checkAndHandleGitHubUserPage();
        });
        buttonContainer.appendChild(deleteButton);
      }

      const addEditButton = addButton(
        "Add or edit notes for " + userName,
        () => {
          const newNotes = prompt("Enter new notes for this user:");
          if (newNotes !== null) {
            browser.runtime.sendMessage({
              action: "addOrEditNotes",
              userName: userName,
              notes: newNotes,
            });
            addOrEditHoverText(newNotes);
            checkAndHandleGitHubUserPage();
          }
        },
      );

      buttonContainer.appendChild(addEditButton);
      document.body.appendChild(buttonContainer);
    },
  );
};

///v main worker
const checkAndHandleGitHubUserPage = () => {
  if (isGitHubUserPage()) {
    handleGitHubUserPage();
  }
};

// take care of guys that load github specific page when boot
checkAndHandleGitHubUserPage();

///v url change worker decleration
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    checkAndHandleGitHubUserPage();
  }
}).observe(document, { subtree: true, childList: true });
///^ url change worker decleration
///^ main worker
