# On front end architecture

The correct way to think about front end applications is "What is the ideal experience for the user". I've seen too many developers from the outset consider technical limitations when approaching architectural decisions for the front end. These are not UI decisions, but how should I structure my code to be best suited to fulfill the ideal user experience.

What is the ideal user experience? Well, hard to define the totality of that, but we do know 3 major ones at least. Visual consistency, Lively data and Responsiveness.

Visual consistency says we should probably share components, and put css colors in variables, it doesn't say anything about how things look but that they should probably be consistent.

Lively data means ideally every server update streams live to the user, no refresh, no user action required. Now this one needs to be broken down to solve because there are some constraints of the client server model that may or may not be worth it to work around.

Responsiveness means that each network request is instant, including the initial html and css. We want everything to be loaded and actionable as quickly as possible. Once loaded the website should also be responsive in the sense of responding to user actions, but this feels a bit more like UX/design than architecture to me.

Now, there is a bit of an issue with lively data and responsiveness, these two are at opposing each other in trade offs. Anytime you go to the network there's the potential of causing a loading state and affecting responsiveness.

Luckily it is a solved problem through various means, and I think I mostly agree with the logos they use, but not always the specific implementation. Some non-exclusive examples are:
-Websockets for live updates
	Liveliest data
	little to no responsiveness effect if implemented well
	Much more costly overall than http
-Polling
	Straight forward
	easy to retro-fit onto existing systems
	Much more server side load for each client that necessary
-Front end caching
	Provides responsiveness
	Often used with other mechanism
	Data liveliness not handled, and sometimes impacted negatively
-Optomistic responses
	A subset of caching that works in relation to CUD of CRUD


So how do I handle this tradeoff?

Abstractions!

The way I see it there are three main parts of the front end, the display, the state and the network. Each of these is such a separate concern from each other that it doesn't make sense to me to couple their implementation details. Luckily, by breaking out each part the front end becomes highly composable and easy to write.

To break out each part, the display is the component that actually shows the data, a trivial example is:
```js
const User = ({name, age}) => {
	return <div className='user-card'>
		<div>{name}</div>
		<div>{age}</div>
	</divv>
}
```

The network is the literal network requests, this can include caching, optomistic responses, websockets, all the fun solutions mentioned before.

The state is tracking the users interactions within the website, the form data, what things on the page they have selected, what values are in dropdowns, this kind of code. Because this is a separate concern, the User component above should not store its own state, instead it should expect all data to be avaible upon render within props.

```js
const User = ({name, age, isSelected}) => {
	return <div className={isSelected ? 'user-card-selected':'user-card'}>
		<div>{name}</div>
		<div>{age}</div>
	</divv>
}


const User = ({name, age, selected}) => {
	return <div className={selected.name === name ? 'user-card-selected':'user-card'}>
		<div>{name}</div>
		<div>{age}</div>
	</divv>
}

```

There are two main downsides to these assuptions, 1) prop drilling and 2) prop naming conflicts.

Prop drilling I don't really understand to be honest, yes props can become a blob larger than what it needs but you can recompose the page to your liking if the prop chain gets too long. It's worth the bloat to props in some passthrough cases to keep the display components simple. 

The second problem is just kind of annoying, to make components interchangeble and fully composible you need to assume what props you're operating on. Below is an sudocode implementation that demonstrates the problem. There are a couple ways to work around this but let me tell you, they all suck. The simpliest one is you pass the key in to the map and assume your network manager can use the route or something derived from the network as the key.
```html
const map = (props) => { //this is a display component, it doesnt control state or network.
	const {
		data, 
		children
	} = props
	return <div>data.map((a)=>React.cloneChildren(children, {...props, ...a})}</div>
}

const networkAbstraction = ({method = 'get', route, children, ...props}) => {
	const useState = ({loading, data})
	... do network request management

	if(loading){
		return <div>loading</div>
	}

	return React.CloneChildren(children, {data, ...props})

}

const page = () => {
	return <networkAbstraction route={"/accounts"}>
		<map>
			<Account>
				<networkAbstraction route={"/user"}>
					<map>
						<User/>
					</map>
				</networkAbstraction>	
			</Account>
		</map>
	</networkAbstraction>
}
```

An example of the simplest solution I've found is below, but I still dislike that I have to provide data key, but it's pretty robust.
```html
const map = (props) => {
	const {
		dataKey
		children
	} = props
	return <div>props[dataKey].map((a)=>React.cloneChildren(children, {...props, ...a})}</div>
}

const networkAbstraction = ({method = 'get', route, children, ...props}) => {
	const useState = ({loading, data})
	// do network request management

	if(loading){
		return <div>loading</div>
	}

	//assume data is something like {accounts:[{name:'nolan', ...}]}
	return React.CloneChildren(children, {...data, ...props})
}

const page = () => {
	return <networkAbstraction route={"/accounts"}>
		<map dataKey='accounts'>
			<Account>
				<networkAbstraction route={"/users"}>
					<map dataKey='users'>
						<User/>
					</map>
				</networkAbstraction>	
			</Account>
		</map>
	</networkAbstraction>
}
```


//TODO come up with a better example for this, I dont remember why props got so tagled I added cleanProps
When writting really overcomplicated UIs I've found this solution to fall short too. I don't think these pages have any reason to exist long term, its the kind of popup in a popup in a popup sillyness that causes props to get so tangled that dataKey doesnt work. I've found that during prototying its useful to be able to work with UI's that overcomplicated, the way to do that is to add in a cleanProps function to the props state management and reusable display (like map component above) components. 
```js
const map = (props) => {
	const {
		dataKey
		children,
		cleanProps
	} = props
	return <div>props[dataKey].map((a)=>React.cloneChildren(children, {...cleanProps(props), ...a})}</div>
}
```



//TODO flush out these examples
Examples of this is:
```js

const User = ({name, age}) => {
	return <div>
		<div>{name}</div>
		<div>{age}</div>
	</divv>
}

const networkLoadingSplit = (component, loading) => {
	return (props) => {
		if(props.network.loading){
			return component
		}
		return loading
	}
}

const networkAbstraction = ({method, route, data, children}) => {
	const useState = ({loading, data})
	... do network request management

	return React.CloneChildren(children, {network:{loading, data}})

}

<networkAbstraction route={} data ={}>
	<networkLoadingSplit>
		<User/> 
		<MyLoading/>
	</networkLoadingSplit>
<networkAbstraction>
```


I like using props.children, to me the code below is just too clear to not write it this way.
```html
<networkAbstraction route={} data ={}>
	<networkLoadingSplit>
		<User/> 
		<MyLoading/>
	</networkLoadingSplit>
<networkAbstraction>
```


There are so many other ways to factor this, I understand concerns with prop drilling and such, the clarity of opening a page and seeing the following is too appealing for me personally:
```
const myPage = (props) =>{
	return <page>
		<hero>
			<settings/>
			<logo/>
			<settings/>
		</hero>
		<column>
			<networkAbstraction>
				<NetworkLoadingSwitch>
					<multiSelectStateProvider>
						<mapNetworkData>
							<user/>
						</mapNetworkData>
					</multiSelectStateProvider>
					<networkLoading/>
				</networkAbstraction>
			</networkAbstraction>
		</column>
	<page>
}
```



I still have the issue of how to implement the network abstraction though, but this is much simpler now that it's a separate concern than the rendering cycle. You can place it where you need, at the correct scope within the dom and use it where you need.

