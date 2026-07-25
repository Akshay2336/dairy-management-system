import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

function Login(){

const [email,setEmail] = useState("");
const [password,setPassword] = useState("");
const navigate = useNavigate();

const handleLogin = async(e)=>{

e.preventDefault();

try{

const res = await API.post("/auth/login",{

email,
password

});


console.log(res.data);


// save JWT token

localStorage.setItem(
"token",
res.data.token
);


// save user details

localStorage.setItem(
"user",
JSON.stringify(res.data.user)
);


alert("Login Successful");
// move to dashboard later

navigate("/dashboard");


}

catch(error){

console.log(error.response.data);

alert(error.response.data.message);

}

};

return(

<div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">


<div className="bg-white w-full max-w-md p-6 md:p-8 rounded-xl shadow-lg">


<h1 className="text-2xl md:text-3xl font-bold text-center text-green-700 mb-6">
Dairy Management
</h1>


<h2 className="text-xl font-semibold text-center mb-6">
Login
</h2>



<form 
onSubmit={handleLogin}
className="space-y-4"
>


<input
type="email"
placeholder="Enter Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
className="w-full p-3 border rounded-lg outline-none focus:border-green-500"
/>



<input
type="password"
placeholder="Enter Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
className="w-full p-3 border rounded-lg outline-none focus:border-green-500"
/>



<button
type="submit"
className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700"
>
Login
</button>


</form>


<div className="text-right mt-3">
  <Link
     to="/forgot-password"
    className="text-green-600 hover:underline text-sm"
  >
    Forgot Password?
  </Link>
</div>

<p className="text-center mt-5 text-gray-600">
  Don't have an account?

  <Link
    to="/register"
    className="text-green-600 ml-1 cursor-pointer hover:underline"
  >
    Register
  </Link>
</p>
</div>
</div>
)
}
export default Login;