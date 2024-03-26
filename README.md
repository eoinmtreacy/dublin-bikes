## Setup
1. `git clone https://github.com/eoinmtreacy/comp30380-dublin-bikes/tree/main`
2. `cd comp30830-dublin-bikes`
3. `conda create -n jcd-bikes python=3.11 pip` & `conda activate jcd-bikes`
4. `pip install -r requirements.txt`
5. OPTIONAL: `python db_conn_test.py`
6. `python create_db.py <city-name-here>`
7. `scrape.py` - edit conda env, city
8. `flask run`

# COMP30380 Group 7
Project repo for Software Engineering group project

# Developer notes
## Don't merge your own pull request!
Let somebody know that you've made a PR, even request code review, and make sure somebody else get a sets of eyes on it before we merge into main
## It's a lot easier to catch issues this way than rolling back main after we break everything
If you are uncomfortable with git at all, take it slow and follow each step every single commit for at least the first few <br>
Eventually it'll be second nature
## How to start a new branch
1. Clone repo if you haven't already:
```
git clone https://github.com/eoinmtreacy/comp30380-dublin-bikes.git
```
2. Check out main, pull down from main to pull any changes
`git pull`
3. Checkout a new branch
`git checkout -b BRANCH_NAME`
4. Make changes in branch
5. Checkout main again, and then merge into your branch
```
git checkout main
git pull
git checkout MY_BRANCH
git merge main
git push
```
This checkout into main is to prevent issues with pushing. If you merge main into the branch you've just edited and there are no conflicts and nothing breaks, then it's likely fine.

5. Resolve conflicts if any (reach out to team to resolve): complexity will only increase as sections become closer to each other
