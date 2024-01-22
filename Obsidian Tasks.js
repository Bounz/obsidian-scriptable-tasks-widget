// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: magic;

const uriArguments = args.queryParameters;
const widgetArguments = args.widgetParameter;

//Change these to your bookmarked path folder and vault name
const vault = "CHANGE THIS";
const root = "CHANGE THIS";
const stackOrientation = "vertical" // horizontal | vertical
const displayTasks = ["Overdue", "Today", "Tomorrow", "Two weeks"]; // "Overdue", "Today", "Tomorrow", "Two weeks", "Long Term"
if (widgetArguments) {
    displayTasks = widgetArguments.split("|");
}

// --- DO NOT EDIT BELOW THIS LINE --- //

const linkRegex = /(.+)?(?=\[)(?:\[\[(.+)\]\]|\[(.+)\]\((.+)\))(.+)?/;

function createWidget(taskLists, today, displayTasks, textSize, maxLen, widgetHeight) {
    let w = new ListWidget();
    w.url = `obsidian://advanced-uri?vault=${vault}&daily=true`;

    // Global Title
    let titleStack = w.addStack();
    titleStack.topAlignContent();
    let title = titleStack.addText("Tasks");
    title.font = Font.boldSystemFont(textSize * 1.5);
    title.textColor = Color.dynamic(Color.black(), Color.white());
    title.minimumScaleFactor = 1;
    title.url = `obsidian://advanced-uri?vault=${vault}&daily=true&heading=` + title.text;

    titleStack.addSpacer(textSize * 1.25);

    // Add new task button
    let newTasks = titleStack.addStack();
    let newTasksButton = newTasks.addText("+ Add New");
    newTasksButton.font = Font.semiboldRoundedSystemFont(textSize * 1.25);
    newTasksButton.textColor = Color.dynamic(Color.gray(), Color.lightGray());
    newTasksButton.minimumScaleFactor = 1;
    newTasksButton.url = `obsidian://advanced-uri?vault=${vault}&daily=true&heading=New%20Tasks&data=%22-%20%5B%20%5D%20%22&mode=prepend`

    w.addSpacer(2);

    const imageManager = FileManager.iCloud();
    const imagePath = imageManager.bookmarkedPath("Scriptable")
    imageManager.downloadFileFromiCloud(imagePath + `/Complete.png`);
    imageManager.downloadFileFromiCloud(imagePath + `/Incomplete.png`);
    const completeImage = imageManager.readImage(imagePath + `/Complete.png`);
    const incompleteImage = imageManager.readImage(imagePath + `/Incomplete.png`)

    let mainStack = w.addStack();

    if (stackOrientation == "vertical") {
        // vertical stack for all tasks
        const spacerHeight = createOneListWidget(mainStack, taskLists, today, displayTasks, textSize, maxLen, widgetHeight, completeImage, incompleteImage);
        w.addSpacer(spacerHeight);
    } else {
        // horizontal stack for each task list
        const spacerHeight = createHorizontalWidget(mainStack, taskLists, today, displayTasks, textSize, maxLen, widgetHeight, completeImage, incompleteImage);
        w.addSpacer(spacerHeight);
    }

    return w;
}

function createOneListWidget(mainStack, taskLists, today, displayTasks, textSize, maxLen, widgetHeight, completeImage, incompleteImage) {
    mainStack.layoutVertically();
    let height = textSize * 3 + 2;

    // Adds stacks for each of my task groups
    for (let taskListType of displayTasks) {

        if (height > widgetHeight) {
            break;
        }

        let stack = mainStack.addStack();
        stack.layoutVertically();

        createListTitle(stack, taskListType, textSize);
        height += textSize * 3 + 2
        let taskListLength = taskLists[taskListType].length;

        if (taskListLength == 0) {
            let line = stack.addText((taskListType == `Overdue`) ? `Nothing Overdue!` : (taskListType == "Two weeks") ? `Nothing Due in ${taskListType}` : `Nothing Due ${taskListType}!`);
            line.font = Font.lightSystemFont(textSize);
            line.textColor = Color.dynamic(Color.darkGray(), Color.lightGray());
        } else {
            let tasksAdded = 0;
            let tasks = taskLists[taskListType].slice(0, maxLen);
            for (let task of tasks) {
                const taskStack = createTaskStack(stack, task, textSize, maxLen, completeImage, incompleteImage, today);
                tasksAdded++;
                //For measuring length of widget to add a spacer later to make sure widget stays aligned to top
                height += textSize * 1.25
                if (height > widgetHeight) {
                    break;
                }
            }

            //Add a see more... button if there are more tasks available
            if (tasksAdded < taskListLength) {
                let more = stack.addText("See more...")
                more.font = Font.semiboldRoundedSystemFont(textSize);
                more.textColor = new Color("#8f6fff");
                more.url = `obsidian://advanced-uri?vault=${vault}&daily=true`;
                height += textSize * 1.25
            }
            stack.minimumScaleFactor = 1;
        }

        mainStack.addSpacer(6);
    }

    return widgetHeight - height;
}

function createHorizontalWidget(mainStack, taskLists, today, displayTasks, textSize, maxLen, widgetHeight, completeImage, incompleteImage) {
    mainStack.layoutHorizontally();

    let maxListHeight = textSize * 3 + 2

    // Adds stacks for each of my task groups
    for (let taskListType of displayTasks) {
        let stack = mainStack.addStack();
        stack.layoutVertically();

        createListTitle(stack, taskListType, textSize);
        let listHeight = textSize * 3 + 2
        let taskListLength = taskLists[taskListType].length;

        if (taskListLength == 0) {
            // If no tasks then print a message
            let line = stack.addText((taskListType == `Overdue`) ? `Nothing Overdue!` : (taskListType == "Two weeks") ? `Nothing Due in ${taskListType}` : `Nothing Due ${taskListType}!`);
            line.font = Font.boldSystemFont(textSize);
            line.textColor = Color.dynamic(Color.black(), Color.white());
        } else {
            var tasks = taskLists[taskListType].slice(0, maxLen);
            for (let task of tasks) {
                const taskStack = createTaskStack(stack, task, textSize, maxLen, completeImage, incompleteImage, today);
                // For measuring length of widget to add a spacer later to make sure widget stays aligned to top
                listHeight += textSize * 1.25
                if (listHeight > maxListHeight) {
                    maxListHeight = listHeight
                }
            }

            // Add a see more... button if there are more tasks available
            if (maxLen < taskListLength) {
                let more = stack.addText("See more...")
                more.font = Font.semiboldRoundedSystemFont(textSize);
                more.textColor = new Color("#8f6fff");
                more.url = `obsidian://advanced-uri?vault=${vault}&daily=true&heading=` + title.text.replaceAll(" ", "%20");
                maxListHeight += textSize * 1.25
            }
            stack.minimumScaleFactor = 1;
        }

        mainStack.addSpacer(10);
    }

    return widgetHeight - maxListHeight;
}

function createListTitle(stack, taskListType, textSize) {
    let title = stack.addText(taskListType);
    title.url = `obsidian://advanced-uri?vault=${vault}&daily=true&heading=` + title.text.replaceAll(" ", "%20");
    title.textColor = Color.purple();
    title.font = Font.boldSystemFont(textSize * 1.25);
    title.minimumScaleFactor = 1;
    stack.addSpacer(3);
}

function createTaskStack(stack, task, textSize, maxLen, completeImage, incompleteImage, today) {
    let addTask = stack.addStack();
    addTask.lineLimit = 1;

    let bullet = addTask.addImage(task.completionDateStr == today ? completeImage : incompleteImage);
    bullet.imageSize = new Size(textSize * 1.25, textSize * 1.25);
    bullet.url = URLScheme.forRunningScript() +
        `?openEditor=false&uriLaunch=true&task=${encodeURIComponent(task.title)}` +
        `&dateDue=${encodeURIComponent(task.dueDateStr)}` +
        `&filePath=${encodeURIComponent(task.path)}` +
        `&lineNumber=${task.matchLine}` +
        `&complete=${task.completionDateStr == today ? "false" : "true"}`;

    // When a task has a link (website or note link), make sure link is interactable, and rest of task is not)
    if (linkRegex.test(task.title)) {
        let before = addTask.addText(task.title.replace(linkRegex, "$1"))
        before.font = Font.systemFont(textSize);
        before.textColor = Color.dynamic(Color.black(), Color.white());
        before.lineLimit = 1;

        if (task.title.replace(linkRegex, "$2")) {
            let link = addTask.addText(task.title.replace(linkRegex, "$2"))
            link.url = `obsidian://advanced-uri?vault=${vault}&filepath=` + task.title.replace(linkRegex, "$2").replaceAll(" ", "%2520") + ".md"
            link.textColor = new Color("#7e1dfb");
            link.font = Font.semiboldRoundedSystemFont(textSize);
            link.lineLimit = 1;
        } else {
            let link = addTask.addText(task.title.replace(linkRegex, "$3"))
            link.url = task.title.replace(linkRegex, "$4")
            link.textColor = new Color("#7e1dfb");
            link.font = Font.semiboldRoundedSystemFont(textSize);
            link.lineLimit = 1;
        }

        let after = addTask.addText(task.title.replace(linkRegex, "$5"))
        after.font = Font.systemFont(textSize);
        after.textColor = Color.dynamic(Color.black(), Color.white());
        after.lineLimit = 1;
    } else {
        let line = addTask.addText(task.title)
        line.font = Font.systemFont(textSize);
        line.textColor = Color.dynamic(Color.black(), Color.white());
        line.lineLimit = 1;
    }
}

// This is the main function to comb through my folder structure for every daily note- Comb each note for something that matches a regex "- [ ] xxx" with out without an ending date "YYYY-MM-DD"
async function findTasks(dateToday) {
    // Regexp to filter tasks and make a match that has [Full task, Task name, Due date, Task Name if no due date]
    const taskRegex = /- \[[x /]\] (.*?)(?: 📅 (\d{4}-\d{2}-\d{2}).*?)?(?: ✅ (\d{4}-\d{2}-\d{2}))?$/

    // Set up file manager, finds the amount of Year folders in the Daily Notes folder and sets up storage arrays
    let fileManager = FileManager.iCloud();
    const rootPath = fileManager.bookmarkedPath(root);
    let years = await fileManager.listContents(rootPath);
    let overdueTasks = [];
    let todayTasks = [];
    let tomorrowTasks = [];
    let nextTwoWeeksTasks = [];
    let longTermTasks = [];

    // Loops through each year folder
    for (let year of years) {
        if (!fileManager.isDirectory(rootPath + "/" + year)) {
            console.log(rootPath + "/" + year + "is not a folder")
        }

        // Finds each month folder in the year and loops through
        let months = await fileManager.listContents(rootPath + "/" + year);
        for (let month of months) {

            if (!fileManager.isDirectory(rootPath + "/" + year + "/" + month)) {
                console.log(rootPath + "/" + year + "/" + month + "is not a folder")
            }

            let files = await fileManager.listContents(rootPath + "/" + year + "/" + month);
            for (let file of files) {

                // Download file from icloud, read contents, split by line, store file path
                let filePath = rootPath + "/" + year + "/" + month + "/" + file;
                if (!fileManager.fileExists(filePath)) {
                    await fileManager.downloadFileFromiCloud(filePath);
                }
                let fileContents = await fileManager.readString(filePath);
                let lines = fileContents.split("\n");
                let originalTaskPath = "/" + year + "/" + month + "/" + file
                let lineIndex = 0

                for (let line of lines) {

                    let match = line.trimEnd().match(taskRegex);
                    let matchLine = lineIndex;

                    lineIndex++;
                    if (!match)
                        continue;

                    let completionDateStr = match[3];
                    let completionDate = parseInt(Date.parse(completionDateStr));
                    //If Task has a due date in past
                    if (completionDateStr != null && completionDate < dateToday)
                        continue;

                    let dueDateStr = match[2];
                    if (dueDateStr) {
                        let taskTitle = match[1];
                        let dueDate = parseInt(Date.parse(dueDateStr));

                        //sort task to array based on due date
                        if (dueDate == dateToday) {
                            todayTasks.push([taskTitle, dueDate, dueDateStr, originalTaskPath, matchLine, completionDateStr]);
                        } else if (dueDate < dateToday) {
                            overdueTasks.push([taskTitle, dueDate, dueDateStr, originalTaskPath, matchLine, completionDateStr]);
                        } else if (dueDate <= tomorrow) {
                            tomorrowTasks.push([taskTitle, dueDate, dueDateStr, originalTaskPath, matchLine, completionDateStr]);
                        } else if (dueDate <= twoWeeks) {
                            nextTwoWeeksTasks.push([taskTitle, dueDate, dueDateStr, originalTaskPath, matchLine, completionDateStr]);
                        } else {
                            longTermTasks.push([taskTitle, dueDate, dueDateStr, originalTaskPath, matchLine, completionDateStr]);
                        }
                    }

                } // lines
            } // files      
        }
    } // years

    let taskLists = { "Overdue": overdueTasks, "Today": todayTasks, "Tomorrow": tomorrowTasks, "Two weeks": nextTwoWeeksTasks, "Long Term": longTermTasks };

    // sort each task list by due date (earliest due at top)
    for (let taskList in taskLists) {
        taskLists[taskList].sort((a, b) => a[1] - b[1]);

        taskLists[taskList] = taskLists[taskList].map(task => {
            const [title, , dueDateStr, path, matchLine, completionDateStr] = task;
            return { title, dueDateStr, path, matchLine, completionDateStr };
        });
    }

    return taskLists;
}


// get today in format YYYY-MM-DD, also gets dateToday in millisecond format and tomorrow, and two weeks so that they can get compared later to decide when tasks are due
const today = new Date().toISOString().split('T')[0];
const dateToday = parseInt(Date.parse(today));
const tomorrow = dateToday + 86400000;
const twoWeeks = dateToday + 86400000 * 14;

let taskLists = await findTasks(dateToday);

if (config.runsInWidget) {
    runInWidget(taskLists, today, displayTasks);
} else if (uriArguments.uriLaunch) {
    await widgetCallback(uriArguments);
} else {
    runInEditor(taskLists, today, displayTasks);
}

function runInWidget(taskLists, today, displayTasks) {
    let textSize = 0;
    let maxLen = 0
    // widget height is very dependent on device type
    let widgetHeight = 0
    if (config.widgetFamily == "extraLarge") {
        textSize = 12;
        maxLen = 17;
        widgetHeight = 288.5
    } else if (config.widgetFamily == "large") {
        textSize = 17;
        maxLen = 12;
        widgetHeight = 288.5
    } else if (config.widgetFamily == "medium") {
        textSize = 17;
        maxLen = 3;
        widgetHeight = 130
    } else if (config.widgetFamily == "small") {
        textSize = 10;
        maxLen = 12;
        widgetHeight = 130
    } else if (config.widgetFamily == null) {
        textSize = 12;
        maxLen = 17;
        widgetHeight = 288.5
    }

    let widget = createWidget(taskLists, today, displayTasks, textSize, maxLen, widgetHeight);
    Script.setWidget(widget);
    Script.complete();
}

async function widgetCallback(uriArguments) {
    App.close();
    let fileManager = FileManager.iCloud();
    let filePath = fileManager.bookmarkedPath(root) + uriArguments.filePath;
    if (!fileManager.fileExists(filePath)) {
        await fileManager.downloadFileFromiCloud(filePath);
    }
    let fileLines = fileManager.readString(filePath);
    fileLines = fileLines.split("\n");
    let replaceRegex = new RegExp(`- \\[[ x]\\] ${uriArguments.task.replaceAll("\[", "\\[").replaceAll("\]", "\\]").replaceAll("\(", "\\(").replaceAll("\)", "\\)")}.*📅.*${uriArguments.dateDue}.*`);

    for (let i = 0; i < fileLines.length; i++) {
        if (fileLines[i].match(replaceRegex)) {
            if (uriArguments.complete == "true") {
                fileLines[i] = "- [x] " + uriArguments.task + " 📅 " + uriArguments.dateDue + " ✅ " + today;
            } else {
                fileLines[i] = "- [ ] " + uriArguments.task + " 📅 " + uriArguments.dateDue;
            }
        }
    }

    fileLines = fileLines.join("\n");
    fileManager.writeString(fileManager.bookmarkedPath(root) + uriArguments.filePath, fileLines);
}

function runInEditor(taskLists, today, displayTasks) {
    const textSize = 12;
    const maxLen = 17;
    let widget = createWidget(taskLists, today, displayTasks, textSize, maxLen);
    widget.presentLarge();
}
