# Active Wheels

### Here is the [Live Website Link](https://active-wheels.web.app/) to view it in your browser.

## Project Details

* This is a website of a car parts manufacturing company. On this Website you can buy car parts and manage them if you are admin.

* This is a website of a car parts manufacturing company. On this Website you can buy car parts and manage them if you are admin.

* On the Homepage, there are several sections. There is a banner, some car parts that you can buy, Business Summary, Reviews, and more. If you click on the place order button you will be taken to the purchase page. From there you can choose your desired quantity and purchase the parts. Purchased parts will be saved on the database with your information.

* There is a Dashboard section. It has nested routing applied to it. Normal users will see three options there. My orders, Add Review, and My profile. My orders will hold information of all your orders. You can pay for your orders using a credit card. After paying the orders will be marked paid and you will be shown the Transaction Id. You can add a review in Add Review page. You can update your profile in My profile page.

* Admins will see more options in the dashboard. They will see My profile, Add Part, Manage Parts, Make admin and Manage all orders. They can add a part to the website. Also, they can delete any part on the Manage parts page. They can make a user admin. Lastly, they can monitor all orders, ship them or cancel them.

* Users can sign up and log in using email and password. Alternatively, they can log in using google sign in. Also, admin routes are protected. So, if a normal user tries to access routes, he will get logged out and his accessToken will be deleted.

* There is a My portfolio section with my information. Also, there is blog section with answers to some important questions.

## Technologies used : 

* ExpressJS, NodeJS

* MongoDB as Database

* Others: dotenv, JSON Web Token, Stripe.