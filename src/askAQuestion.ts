import inquirer from "inquirer";

export const askAQuestion = async (options: inquirer.RawListQuestionOptions) => {
    const resultOfQustion = await inquirer.prompt([
        {
            ...options,
            name: "answer"
        }
    ]);

    return resultOfQustion.answer;
}; // close
