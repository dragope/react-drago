import { createContext, useState, useContext } from 'react'
import { addDoc, collection, getFirestore, Timestamp } from "firebase/firestore"

const CartContext = createContext([]) 

export const useCartContext = () => useContext(CartContext)  


function CartContextProvider({children}) {
    
    const [cartList, setCartList] = useState([])
    const [orderId, setOrderId] = useState('')
    const [purchaseStatus, setPurchaseStatus] = useState('Checking Cart')
    const [error, setError] = useState('')

    function addToCart(item) {
        const itemIndex = cartList.findIndex(i => i.id === item.id)
        if(itemIndex > -1){
            let stock = cartList[itemIndex].stock
            const prevQuant = parseInt(cartList[itemIndex].quantity)
            stock >= item.quantity &&
                cartList.splice(itemIndex, 1)
                setCartList([...cartList, {...item, stock: stock-item.quantity, quantity: item.quantity + prevQuant, accprice: item.price*(item.quantity+prevQuant)}])
        } else {
            setCartList([...cartList, {...item, stock: item.stock-item.quantity ,accprice: item.price*item.quantity}])
        }
    }
     
    function emptyCart() { 
        setCartList([])
    }
    
    function deleteItem(item){
        const itemIndex = cartList.findIndex(i => i.id === item.id)
        cartList.splice(itemIndex, 1)
        setCartList([...cartList])
    }

    const finalPrice = cartList.map(item => item.accprice).reduce((prev, curr) => prev + curr, 0)

    const createOrder = (e) => {
        e.preventDefault()

        let userName = document.getElementById('user-name').value 
        let userSurname = document.getElementById('user-surname').value
        let userPhone = document.getElementById('user-phone').value
        let userEmail = document.getElementById('user-email').value
        let userConfirmEmail = document.getElementById('user-confirmemail').value
        
        let order = {}
        order.date = Timestamp.fromDate(new Date())
        order.buyer = { name: userName + " " + userSurname, phone: userPhone, email: userEmail }
        order.price = finalPrice

        if (userName === "" || userSurname === "" || userPhone === "" || userEmail === "" || userConfirmEmail === "" ){
            setError("Please complete all the required fields")
        } else if (!/^[a-zA-ZÀ-ÿ\s]{1,40}$/.test(userName) ){
            setError("Name must only contain letters and spaces")
        } else if (!/^[a-zA-ZÀ-ÿ\s]{1,40}$/.test(userSurname) ){
            setError("Surname must only contain letters and spaces")
        } else if (!/^[0-9]*$/.test(userPhone)){
            setError("Phone can only contain numbers") 
        } else if (userEmail !== userConfirmEmail ){
            setError("The emails provided do not match")
        }else if (!/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(userEmail)){
            setError("Invalid email")
        }else {
            order.items = cartList.map(cartItem =>{
                const id = cartItem.id;
                const quantity = cartItem.quantity;
                const title = cartItem.title;
                const price = cartItem.price;
                return {id, quantity, title, price}
            } )
            
            const db = getFirestore()
            const ordenColeccion = collection(db, 'orders')
            addDoc(ordenColeccion, order)
            .then(resp => setOrderId(resp.id))
            .catch(err => console.log(err))
        }
    }

    return (
        <CartContext.Provider value={{
            cartList,
            addToCart,
            emptyCart,
            deleteItem,
            finalPrice,
            createOrder,
            orderId,
            setOrderId,
            purchaseStatus, 
            setPurchaseStatus,
            error,
            setError,
        }}>
            { children }
        </CartContext.Provider>
    )
}
export default CartContextProvider