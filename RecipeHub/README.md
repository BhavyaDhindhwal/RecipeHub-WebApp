1. Authentication APIs
1.1 POST /api/auth/register
![alt text](image.png)
1.2 POST /api/auth/login
![alt text](image-1.png)
1.3 GET /api/auth/me
![alt text](image-2.png)
1.4 PUT /api/auth/profile
![alt text](image-3.png)

2. Recipe APIs
2.1 GET /api/recipes
![alt text](image-4.png)
2.2 GET /api/recipes/categories
![alt text](image-5.png)
2.3 GET /api/recipes/admin/all
![alt text](image-6.png)
2.4 GET /api/recipes/removed
![alt text](image-7.png)
2.5 PATCH /api/recipes/:id/approve
![alt text](image-10.png)
2.6 PATCH /api/recipes/:id/reject
![alt text](image-12.png)
2.7 PATCH /api/recipes/:id/remove
![alt text](image-13.png)
2.8 PATCH /api/recipes/:id/restore
![alt text](image-14.png)
2.9 GET /api/recipes/favourites
![alt text](image-15.png)
2.10 GET /api/recipes/mine
![alt text](image-16.png)
2.11 POST /api/recipes/:id/favourite
![alt text](image-17.png)
2.12 DELETE /api/recipes/:id/favourite
![alt text](image-18.png)
2.13 GET /api/recipes/:id
![alt text](image-19.png)
2.14 POST /api/recipes
![alt text](image-9.png)
![alt text](image-11.png)
2.15 PUT /api/recipes/:id
![alt text](image-20.png)
2.16 DELETE /api/recipes/:id
![alt text](image-21.png)
2.17 POST /api/recipes/:id/reviews
![alt text](image-22.png)
3. Meal Planner APIs
3.1 GET /api/meal-plans
![alt text](image-23.png)
3.2 POST /api/meal-plans/add
![alt text](image-24.png)
3.3 DELETE /api/meal-plans/remove
![alt text](image-25.png)
3.4 POST /api/meal-plans/copy-day
![alt text](image-27.png)
3.5 DELETE /api/meal-plans/clear-day
![alt text](image-26.png)

4. Report APIs
4.1 POST /api/reports/:recipeId
![alt text](image-28.png)
4.2 GET /api/reports
![alt text](image-29.png)
4.3 PATCH /api/reports/:id/status
![alt text](image-30.png)
4.4 PATCH /api/reports/:id/action
![alt text](image-31.png)
5. Admin APIs
5.1 GET /api/admin/stats
![alt text](image-32.png)
5.2 GET /api/admin/users
![alt text](image-33.png)